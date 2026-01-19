import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and, ne } from "drizzle-orm"

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

    // Update name in database
    await db
      .update(users)
      .set({ name: trimmedName })
      .where(eq(users.id, currentDbUser.id))

    // Also update in Supabase user metadata for consistency
    await supabase.auth.updateUser({
      data: { display_name: trimmedName },
    })

    return NextResponse.json(
      { success: true, message: "Name updated successfully" },
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
