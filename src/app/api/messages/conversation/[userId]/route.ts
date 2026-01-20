import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { userMessages, users, messageReadStatus } from "@/lib/db/schema"
import { eq, and, or, desc } from "drizzle-orm"

/**
 * GET /api/messages/conversation/[userId]
 * Gets all messages in a conversation between current user and another user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: otherUserId } = await params

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

    // Get all messages in conversation
    const messages = await db
      .select({
        id: userMessages.id,
        senderId: userMessages.senderId,
        recipientId: userMessages.recipientId,
        content: userMessages.content,
        lobbyId: userMessages.lobbyId,
        sentAt: userMessages.sentAt,
        senderName: users.name,
        senderAvatarUrl: users.avatarUrl,
      })
      .from(userMessages)
      .innerJoin(users, eq(userMessages.senderId, users.id))
      .where(
        or(
          and(
            eq(userMessages.senderId, dbUser.id),
            eq(userMessages.recipientId, otherUserId)
          ),
          and(
            eq(userMessages.senderId, otherUserId),
            eq(userMessages.recipientId, dbUser.id)
          )
        )
      )
      .orderBy(desc(userMessages.sentAt))

    // Get read statuses
    const readStatuses = await db
      .select({
        messageId: messageReadStatus.messageId,
      })
      .from(messageReadStatus)
      .where(eq(messageReadStatus.userId, dbUser.id))

    const readMessageIds = new Set(readStatuses.map(r => r.messageId))

    // Mark unread messages as read
    const unreadMessages = messages.filter(
      m => m.recipientId === dbUser.id && !readMessageIds.has(m.id)
    )

    if (unreadMessages.length > 0) {
      await db.insert(messageReadStatus).values(
        unreadMessages.map(m => ({
          messageId: m.id,
          userId: dbUser.id,
        }))
      )
    }

    // Get other user info
    const [otherUser] = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, otherUserId))
      .limit(1)

    return NextResponse.json(
      {
        messages: messages.map(m => ({
          ...m,
          isRead: m.recipientId === dbUser.id ? readMessageIds.has(m.id) : true,
          isOwn: m.senderId === dbUser.id,
        })),
        otherUser: otherUser || null,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error fetching conversation:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch conversation",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
