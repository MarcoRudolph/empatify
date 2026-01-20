import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users, userMessages } from "@/lib/db/schema"
import { eq, and, ne, or, sql } from "drizzle-orm"

/**
 * PUT /api/user/update-name
 * Updates the user's display name in the database
 * Body: { name: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          },
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Name is required",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    // Get current user's database record
    const [currentDbUser] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    if (!currentDbUser) {
      return NextResponse.json(
        {
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found in database",
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // If name hasn't changed, return success
    if (currentDbUser.name === trimmedName) {
      return NextResponse.json(
        { success: true, message: "Name unchanged" },
        { status: 200 }
      )
    }

    // Check if name is already taken by another user
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.name, trimmedName),
          ne(users.id, currentDbUser.id) // Exclude current user
        )
      )
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: "NAME_ALREADY_TAKEN",
            message: "This name is already taken",
            status: 409,
          },
        },
        { status: 409 }
      )
    }

    // Store old name before updating
    const oldName = currentDbUser.name
    
    // Update name in database
    await db
      .update(users)
      .set({ name: trimmedName })
      .where(eq(users.id, currentDbUser.id))

    // Also update in Supabase user metadata for consistency
    await supabase.auth.updateUser({
      data: { display_name: trimmedName },
    })

    // Send system message to all chat partners about name change
    try {
      // Find all unique users who have had conversations with this user
      const conversationPartners = await db
        .selectDistinct({ 
          partnerId: sql<string>`CASE 
            WHEN ${userMessages.senderId} = ${currentDbUser.id} THEN ${userMessages.recipientId}
            ELSE ${userMessages.senderId}
          END`.as('partnerId')
        })
        .from(userMessages)
        .where(
          or(
            eq(userMessages.senderId, currentDbUser.id),
            eq(userMessages.recipientId, currentDbUser.id)
          )
        )

      // Send a system message to each conversation partner
      // System message format: "[oldname] renamed to [newname]"
      const systemMessage = `__SYSTEM_RENAME__:${oldName}:${trimmedName}`
      
      for (const partner of conversationPartners) {
        if (partner.partnerId) {
          // Send from current user to partner (will appear in their conversation)
          await db.insert(userMessages).values({
            senderId: currentDbUser.id,
            recipientId: partner.partnerId,
            content: systemMessage,
          })
          
          // Also send reverse direction so it appears in both sides of conversation
          await db.insert(userMessages).values({
            senderId: partner.partnerId,
            recipientId: currentDbUser.id,
            content: systemMessage,
          })
        }
      }
    } catch (messageError) {
      // Log error but don't fail the name update
      console.error("Error sending rename notifications:", messageError)
    }

    return NextResponse.json(
      { success: true, message: "Name updated successfully", oldName, newName: trimmedName },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error updating name:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to update name",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
