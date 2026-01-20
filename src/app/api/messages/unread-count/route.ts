import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { userMessages, users, messageReadStatus } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * GET /api/messages/unread-count
 * Gets the count of unread messages for the current user
 */
export async function GET(request: NextRequest) {
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

    // Get all read message IDs
    const readStatuses = await db
      .select({
        messageId: messageReadStatus.messageId,
      })
      .from(messageReadStatus)
      .where(eq(messageReadStatus.userId, dbUser.id))

    const readMessageIds = new Set(readStatuses.map(r => r.messageId))

    // Count unread messages (all received messages minus read ones)
    const allReceivedMessages = await db
      .select({ id: userMessages.id })
      .from(userMessages)
      .where(eq(userMessages.recipientId, dbUser.id))

    const unreadCount = allReceivedMessages.filter(
      m => !readMessageIds.has(m.id)
    ).length

    return NextResponse.json(
      {
        unreadCount,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error fetching unread count:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch unread count",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
