import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { submitterGuesses, songs, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// POST /api/lobby/[id]/guess-submitter
// Body: { guesses: { songId: string; guessedUserId: string }[] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: lobbyId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: { code: "UNAUTHORIZED", status: 401 } }, { status: 401 })

  const [dbUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, user.email!)).limit(1)
  if (!dbUser) return NextResponse.json({ error: { code: "USER_NOT_FOUND", status: 404 } }, { status: 404 })

  const { guesses } = await request.json() as { guesses: { songId: string; guessedUserId: string }[] }

  let correct = 0
  const results = []

  for (const { songId, guessedUserId } of guesses) {
    const [song] = await db.select({ suggestedBy: songs.suggestedBy }).from(songs).where(eq(songs.id, songId)).limit(1)
    if (!song) continue
    const isCorrect = song.suggestedBy === guessedUserId
    if (isCorrect) correct++

    await db
      .insert(submitterGuesses)
      .values({ lobbyId, songId, guesserId: dbUser.id, guessedUserId, isCorrect })
      .onConflictDoNothing()

    results.push({ songId, guessedUserId, isCorrect, actualUserId: song.suggestedBy })
  }

  return NextResponse.json({ correct, total: guesses.length, results }, { status: 200 })
}
