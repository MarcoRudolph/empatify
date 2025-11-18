import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { songs, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

/**
 * GET /api/spotify/song-callback
 * Callback route after song selection in Spotify
 * Expects spotifyTrackId in query params and saves it
 */
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const lobbyId = requestUrl.searchParams.get("lobbyId")
    const roundNumber = requestUrl.searchParams.get("roundNumber")
    const spotifyTrackId = requestUrl.searchParams.get("trackId") || 
                          requestUrl.searchParams.get("spotifyTrackId")

    if (!lobbyId || !roundNumber) {
      return NextResponse.redirect(
        new URL(`/lobby/${lobbyId || ""}?error=missing_params`, requestUrl.origin)
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(
        new URL(`/lobby/${lobbyId}?error=unauthorized`, requestUrl.origin)
      )
    }

    // If trackId is provided, save it
    if (spotifyTrackId) {
      // Get user's database ID
      const [dbUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, user.email!))
        .limit(1)

      if (dbUser) {
        // Check if user already suggested a song for this round
        const existingSong = await db
          .select()
          .from(songs)
          .where(
            and(
              eq(songs.lobbyId, lobbyId),
              eq(songs.suggestedBy, dbUser.id),
              eq(songs.roundNumber, parseInt(roundNumber))
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
            roundNumber: parseInt(roundNumber),
          })
        }
      }
    }

    // Redirect back to lobby
    return NextResponse.redirect(new URL(`/lobby/${lobbyId}`, requestUrl.origin))
  } catch (error: any) {
    console.error("Error in song callback:", error)
    const lobbyId = new URL(request.url).searchParams.get("lobbyId") || ""
    return NextResponse.redirect(
      new URL(`/lobby/${lobbyId}?error=callback_failed`, new URL(request.url).origin)
    )
  }
}

