import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { songs, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

/**
 * POST /api/lobby/[id]/song
 * Saves a song suggestion for the current user in the specified round
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
    const { spotifyTrackId, roundNumber } = body

    if (!spotifyTrackId || !roundNumber) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "spotifyTrackId and roundNumber are required",
            status: 400,
          },
        },
        { status: 400 }
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

    // Check if user already suggested a song for this round
    const existingSong = await db
      .select()
      .from(songs)
      .where(
        and(
          eq(songs.lobbyId, lobbyId),
          eq(songs.suggestedBy, dbUser.id),
          eq(songs.roundNumber, roundNumber)
        )
      )
      .limit(1)

    if (existingSong.length > 0) {
      // Update existing song
      await db
        .update(songs)
        .set({
          spotifyTrackId,
        })
        .where(eq(songs.id, existingSong[0].id))
    } else {
      // Create new song
      await db.insert(songs).values({
        spotifyTrackId,
        lobbyId,
        suggestedBy: dbUser.id,
        roundNumber,
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Error saving song:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to save song",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}

