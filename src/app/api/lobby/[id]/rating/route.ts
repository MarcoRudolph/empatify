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

    // Validate UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!lobbyId || !uuidRegex.test(lobbyId)) {
      console.error("❌ Invalid lobby ID format in rating route:", {
        lobbyId,
        lobbyIdType: typeof lobbyId,
        lobbyIdLength: lobbyId?.length,
      })
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ID",
            message: "Invalid lobby ID format",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

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

    // Validate songId UUID format
    if (!uuidRegex.test(songId)) {
      console.error("❌ Invalid song ID format in rating route:", {
        songId,
        songIdType: typeof songId,
        songIdLength: songId?.length,
      })
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ID",
            message: "Invalid song ID format",
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

    // Verify song belongs to this lobby with detailed logging
    console.log("🔍 Verifying song in lobby:", {
      songId,
      songIdLength: songId.length,
      lobbyId,
      lobbyIdLength: lobbyId.length,
    })

    let song
    try {
      const songResult = await db
        .select()
        .from(songs)
        .where(and(eq(songs.id, songId), eq(songs.lobbyId, lobbyId)))
        .limit(1)
      
      song = songResult[0]
      console.log("✅ Song verification result:", song ? "Found" : "Not found")
    } catch (dbError: any) {
      console.error("❌ Database error verifying song:", {
        error: dbError?.message,
        cause: dbError?.cause,
        songId,
        lobbyId,
        query: dbError?.query,
        params: dbError?.params,
      })
      throw dbError
    }

    if (!song) {
      console.error("❌ Song not found in lobby:", {
        songId,
        lobbyId,
      })
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
      console.error("❌ User not found in database:", {
        email: user.email,
      })
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
    console.log("🔍 Checking existing rating:", {
      songId,
      userId: dbUser.id,
    })

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
      console.log("✅ Updating existing rating:", {
        ratingId: existingRating[0].id,
        oldValue: existingRating[0].ratingValue,
        newValue: ratingValue,
      })
      await db
        .update(ratings)
        .set({
          ratingValue,
        })
        .where(eq(ratings.id, existingRating[0].id))
    } else {
      // Create new rating
      console.log("✅ Creating new rating:", {
        songId,
        userId: dbUser.id,
        ratingValue,
      })
      await db.insert(ratings).values({
        songId,
        givenBy: dbUser.id,
        ratingValue,
      })
    }

    console.log("✅ Rating saved successfully")
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("❌ Error saving rating:", {
      error: error?.message,
      cause: error?.cause,
      stack: error?.stack,
      query: error?.query,
      params: error?.params,
    })
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
