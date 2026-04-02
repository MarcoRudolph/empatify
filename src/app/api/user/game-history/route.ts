import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { lobbies, lobbyParticipants, users, songs, ratings } from "@/lib/db/schema"
import { eq, desc, inArray, avg, count } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", status: 401 } }, { status: 401 })

  const [dbUser] = await db
    .select({ id: users.id, proPlan: users.proPlan })
    .from(users).where(eq(users.email, user.email!)).limit(1)
  if (!dbUser) return NextResponse.json({ error: { code: "USER_NOT_FOUND", status: 404 } }, { status: 404 })

  const limit = dbUser.proPlan ? 100 : 3

  const participations = await db
    .select({ lobbyId: lobbyParticipants.lobbyId })
    .from(lobbyParticipants)
    .where(eq(lobbyParticipants.userId, dbUser.id))

  const lobbyIds = participations.map(p => p.lobbyId)
  if (lobbyIds.length === 0) return NextResponse.json({ lobbies: [], top5: [], isPro: dbUser.proPlan })

  const historyLobbies = await db
    .select()
    .from(lobbies)
    .where(inArray(lobbies.id, lobbyIds))
    .orderBy(desc(lobbies.createdAt))
    .limit(limit)

  let top5: any[] = []
  if (dbUser.proPlan) {
    top5 = await db
      .select({
        spotifyTrackId: songs.spotifyTrackId,
        timesChosen: count(songs.id),
        avgRating: avg(ratings.ratingValue),
        totalRatings: count(ratings.id),
      })
      .from(songs)
      .leftJoin(ratings, eq(ratings.songId, songs.id))
      .where(eq(songs.suggestedBy, dbUser.id))
      .groupBy(songs.spotifyTrackId)
      .orderBy(desc(count(songs.id)), desc(avg(ratings.ratingValue)))
      .limit(5)
  }

  return NextResponse.json({ lobbies: historyLobbies, top5, isPro: dbUser.proPlan })
}
