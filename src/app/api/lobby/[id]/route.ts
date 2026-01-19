import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { lobbies, lobbyParticipants, songs, ratings, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

/**
 * DELETE /api/lobby/[id]
 * Deletes a lobby if user is host and no participants exist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Get lobby
    const [lobby] = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, id))
      .limit(1)

    if (!lobby) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Lobby not found",
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

    if (!dbUser || lobby.hostId !== dbUser.id) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Only the host can delete the lobby",
            status: 403,
          },
        },
        { status: 403 }
      )
    }

    // Check participant count (excluding host)
    const participants = await db
      .select()
      .from(lobbyParticipants)
      .where(eq(lobbyParticipants.lobbyId, id))

    // Only allow deletion if no participants (or only host)
    if (participants.length > 1) {
      return NextResponse.json(
        {
          error: {
            code: "CANNOT_DELETE",
            message: "Lobby cannot be deleted because it has participants",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    // Delete lobby (cascade will delete participants, songs, ratings)
    await db.delete(lobbies).where(eq(lobbies.id, id))

    return NextResponse.json(
      {
        success: true,
        message: "Lobby deleted successfully",
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error deleting lobby:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete lobby",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
