import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * DELETE /api/spotify/unlink
 * Removes Spotify connection for the authenticated user
 */
export async function DELETE(request: NextRequest) {
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

    // Get user record from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    if (userRecord.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "USER_NOT_FOUND",
            message: "User record not found",
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // Remove Spotify tokens from database
    await db
      .update(users)
      .set({
        spotifyAccessToken: null,
        spotifyRefreshToken: null,
        spotifyTokenExpiresAt: null,
        spotifyUserId: null,
      })
      .where(eq(users.id, userRecord[0].id))

    return NextResponse.json(
      { message: "Spotify connection removed successfully" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error unlinking Spotify:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}

