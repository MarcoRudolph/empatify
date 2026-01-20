import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { ratings, users, songs } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

/**
 * POST /api/lobby/[id]/rating
 * Saves or updates a rating for a song
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lobbyId } = await params
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
    const { songId, ratingValue } = body

    if (!songId || !ratingValue) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "songId and ratingValue are required",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    // Validate rating value (1-10)
    if (ratingValue < 1 || ratingValue > 10) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "ratingValue must be between 1 and 10",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    // Verify song belongs to this lobby
    const [song] = await db
      .select()
      .from(songs)
      .where(and(eq(songs.id, songId), eq(songs.lobbyId, lobbyId)))
      .limit(1)

    if (!song) {
      return NextResponse.json(
        {
          error: {
            code: "SONG_NOT_FOUND",
            message: "Song not found in this lobby",
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // Get user's database ID
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
            message: "User not found in database",
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // Check if user already rated this song
    const existingRating = await db
      .select()
      .from(ratings)
      .where(
        and(
          eq(ratings.songId, songId),
          eq(ratings.givenBy, dbUser.id)
        )
      )
      .limit(1)

    if (existingRating.length > 0) {
      // Update existing rating
      await db
        .update(ratings)
        .set({
          ratingValue,
        })
        .where(eq(ratings.id, existingRating[0].id))
    } else {
      // Create new rating
      await db.insert(ratings).values({
        songId,
        givenBy: dbUser.id,
        ratingValue,
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Error saving rating:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to save rating",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
