import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { userMessages, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * POST /api/messages/send
 * Sends a private message from current user to recipient(s)
 */
export async function POST(request: NextRequest) {
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
    const { recipientIds, content, lobbyId } = body

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "recipientIds is required and must be an array",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "content is required",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    // Get current user's database ID
    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    if (!dbUser) {
      return NextResponse.json(
        {
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // Send message to each recipient
    const sentMessages = []
    for (const recipientId of recipientIds) {
      // Verify recipient exists
      const [recipient] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, recipientId))
        .limit(1)

      if (!recipient) {
        console.warn(`Recipient ${recipientId} not found, skipping`)
        continue
      }

      // Don't send to self
      if (recipientId === dbUser.id) {
        continue
      }

      const [newMessage] = await db
        .insert(userMessages)
        .values({
          senderId: dbUser.id,
          recipientId: recipientId,
          content: content.trim(),
          lobbyId: lobbyId || null,
        })
        .returning()

      sentMessages.push(newMessage)
    }

    return NextResponse.json(
      {
        success: true,
        messages: sentMessages,
        count: sentMessages.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to send message",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
