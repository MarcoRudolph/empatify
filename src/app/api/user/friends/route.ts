import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { friends, users } from "@/lib/db/schema"
import { eq, or, inArray } from "drizzle-orm"

/**
 * GET /api/user/friends
 * Gets all friends of the current user
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

    // Get all friendships where current user is involved (bidirectional)
    const friendships = await db
      .select({
        friendId: friends.friendId,
        userId: friends.userId,
        addedAt: friends.addedAt,
      })
      .from(friends)
      .where(
        or(
          eq(friends.userId, dbUser.id),
          eq(friends.friendId, dbUser.id)
        )
      )

    // Extract all friend IDs (the ones that are not the current user)
    const friendIds = friendships.map(f => 
      f.userId === dbUser.id ? f.friendId : f.userId
    )

    if (friendIds.length === 0) {
      return NextResponse.json(
        {
          friends: [],
        },
        { status: 200 }
      )
    }

    // Get friend user details
    const friendUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(inArray(users.id, friendIds))

    return NextResponse.json(
      {
        friends: friendUsers,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error fetching friends:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch friends",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
