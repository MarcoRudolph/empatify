import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { friends, users } from "@/lib/db/schema"
import { eq, and, or } from "drizzle-orm"

/**
 * POST /api/user/friend
 * Adds a friend relationship between the current user and another user
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
    const { friendId } = body

    if (!friendId) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "friendId is required",
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

    // Check if trying to add self as friend
    if (dbUser.id === friendId) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "Cannot add yourself as a friend",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    // Check if friend exists
    const [friendUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, friendId))
      .limit(1)

    if (!friendUser) {
      return NextResponse.json(
        {
          error: {
            code: "USER_NOT_FOUND",
            message: "Friend user not found",
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // Check if friendship already exists (bidirectional check)
    const existingFriendship = await db
      .select()
      .from(friends)
      .where(
        or(
          and(eq(friends.userId, dbUser.id), eq(friends.friendId, friendId)),
          and(eq(friends.userId, friendId), eq(friends.friendId, dbUser.id))
        )
      )
      .limit(1)

    if (existingFriendship.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: "ALREADY_FRIENDS",
            message: "Already friends with this user",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    // Add friendship (only one direction needed, but we can add both for easier queries)
    await db.insert(friends).values({
      userId: dbUser.id,
      friendId: friendId,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Friend added successfully",
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error adding friend:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to add friend",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/user/friend?friendId=xxx
 * Checks if a friendship exists between current user and another user
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

    const requestUrl = new URL(request.url)
    const friendId = requestUrl.searchParams.get("friendId")

    if (!friendId) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "friendId is required",
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

    // Check if friendship exists (bidirectional)
    const existingFriendship = await db
      .select()
      .from(friends)
      .where(
        or(
          and(eq(friends.userId, dbUser.id), eq(friends.friendId, friendId)),
          and(eq(friends.userId, friendId), eq(friends.friendId, dbUser.id))
        )
      )
      .limit(1)

    return NextResponse.json(
      {
        isFriend: existingFriendship.length > 0,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error checking friendship:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to check friendship",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
