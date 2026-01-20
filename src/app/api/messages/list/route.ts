import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { userMessages, users, messageReadStatus } from "@/lib/db/schema"
import { eq, or, and, desc, inArray } from "drizzle-orm"

/**
 * GET /api/messages/list
 * Gets all conversations for the current user (grouped by other user)
 * Returns list of conversations with last message and unread count
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

    // Get all messages where user is sender or recipient
    const allMessages = await db
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
          eq(userMessages.senderId, dbUser.id),
          eq(userMessages.recipientId, dbUser.id)
        )
      )
      .orderBy(desc(userMessages.sentAt))

    // Group messages by conversation partner
    const conversationsMap = new Map<string, {
      userId: string
      userName: string
      userAvatarUrl: string | null
      lastMessage: string
      lastMessageTime: Date
      unreadCount: number
      lobbyId: string | null
    }>()

    // Get all read statuses for messages where user is recipient
    const readStatuses = await db
      .select({
        messageId: messageReadStatus.messageId,
      })
      .from(messageReadStatus)
      .where(eq(messageReadStatus.userId, dbUser.id))

    const readMessageIds = new Set(readStatuses.map(r => r.messageId))

    // Get partner user info for all unique partners
    const partnerIds = Array.from(new Set(allMessages.map(m => 
      m.senderId === dbUser.id ? m.recipientId : m.senderId
    )))

    const partnerUsers = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(inArray(users.id, partnerIds))

    const partnerMap = new Map(partnerUsers.map(p => [p.id, p]))

    for (const message of allMessages) {
      // Determine conversation partner
      const partnerId = message.senderId === dbUser.id 
        ? message.recipientId 
        : message.senderId

      // Get partner user info from map
      const partner = partnerMap.get(partnerId)
      if (!partner) continue

      const existingConversation = conversationsMap.get(partnerId)
      const isUnread = message.recipientId === dbUser.id && !readMessageIds.has(message.id)

      if (!existingConversation || message.sentAt > existingConversation.lastMessageTime) {
        conversationsMap.set(partnerId, {
          userId: partner.id,
          userName: partner.name,
          userAvatarUrl: partner.avatarUrl,
          lastMessage: message.content,
          lastMessageTime: message.sentAt,
          unreadCount: isUnread ? 1 : 0,
          lobbyId: message.lobbyId,
        })
      } else if (isUnread) {
        existingConversation.unreadCount++
      }
    }

    // Convert to array and sort by last message time
    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime())

    return NextResponse.json(
      {
        conversations,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch conversations",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
