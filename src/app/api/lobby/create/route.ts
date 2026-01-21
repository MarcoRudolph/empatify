import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db, postgresClient } from "@/lib/db"
import { lobbies, lobbyParticipants, users, userMessages } from "@/lib/db/schema"
import { eq, and, ne } from "drizzle-orm"

/**
 * POST /api/lobby/create
 * Creates a new game lobby
 */
export async function POST(request: NextRequest) {
  // Declare variables outside try-catch for error logging access
  let maxRounds: number = 5
  let lobbyCategory: string | null = null
  let lobbyGameMode: string = "multi-device"
  let userId: string | undefined

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
    const { rounds, category, gameMode, copyFromLobbyId } = body

    console.log("Received lobby creation request:", { rounds, category, gameMode, copyFromLobbyId })

    // If copying from an existing lobby, fetch its settings
    if (copyFromLobbyId) {
      console.log("Copying settings from lobby:", copyFromLobbyId)
      const [existingLobby] = await db
        .select()
        .from(lobbies)
        .where(eq(lobbies.id, copyFromLobbyId))
        .limit(1)

      if (existingLobby) {
        maxRounds = existingLobby.maxRounds
        lobbyCategory = existingLobby.category
        lobbyGameMode = existingLobby.gameMode || "multi-device"
        console.log("Copied settings:", { maxRounds, lobbyCategory, lobbyGameMode })
      } else {
        // Fallback to defaults if lobby not found
        console.warn("Lobby to copy not found, using defaults")
        maxRounds = Math.max(1, Math.min(10, rounds || 5))
        lobbyCategory = category === "all" || !category ? null : category
        lobbyGameMode = gameMode === "single-device" ? "single-device" : "multi-device"
      }
    } else {
      // Validate rounds (1-10)
      maxRounds = Math.max(1, Math.min(10, rounds || 5))
      // Category can be null (for "all")
      lobbyCategory = category === "all" || !category ? null : category
      // Validate game mode (default to multi-device)
      lobbyGameMode = gameMode === "single-device" ? "single-device" : "multi-device"
    }

    console.log("Processed values:", {
      maxRounds,
      lobbyCategory,
      lobbyGameMode,
    })

    // Ensure user exists in database
    // Select only basic columns to avoid Spotify column errors
    let dbUser = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    if (dbUser.length === 0) {
      const displayName =
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User"
      const [newUser] = await db
        .insert(users)
        .values({
          email: user.email!,
          name: displayName,
          avatarUrl: user.user_metadata?.avatar_url || null,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
        })
      dbUser = [newUser]
    }

    userId = dbUser[0].id

    // Check if game_mode column exists before inserting
    let gameModeColumnExists = false
    try {
      console.log("🔍 Checking if game_mode column exists...")
      const columnCheck = await postgresClient`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns 
        WHERE table_name = 'lobbies' 
        AND column_name = 'game_mode'
        LIMIT 1
      `
      gameModeColumnExists = columnCheck.length > 0
      if (gameModeColumnExists) {
        console.log("✅ game_mode column EXISTS:", columnCheck[0])
      } else {
        console.log("❌ game_mode column DOES NOT EXIST")
        // Also check all columns to see what exists
        const allColumns = await postgresClient`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'lobbies'
          ORDER BY ordinal_position
        `
        console.log("📋 Existing columns in lobbies table:", allColumns.map(c => c.column_name))
      }
    } catch (checkError: any) {
      console.error("❌ Error checking for game_mode column:", {
        message: checkError?.message,
        code: checkError?.code,
        stack: checkError?.stack,
      })
      // Assume it doesn't exist and try without it
      gameModeColumnExists = false
    }

    // Create lobby
    let newLobby: any
    if (gameModeColumnExists) {
      // Column exists, insert with gameMode
      console.log("Creating lobby with gameMode:", lobbyGameMode)
      const result = await db
        .insert(lobbies)
        .values({
          hostId: userId,
          category: lobbyCategory,
          maxRounds,
          gameMode: lobbyGameMode,
        })
        .returning()
      newLobby = result[0]
      console.log("Lobby created successfully with gameMode:", newLobby)
    } else {
      // Column doesn't exist, insert without gameMode
      console.warn(
        "game_mode column doesn't exist, creating lobby without it. Please run migration."
      )
      const result = await db
        .insert(lobbies)
        .values({
          hostId: userId,
          category: lobbyCategory,
          maxRounds,
        })
        .returning()
      newLobby = result[0]
      // Add gameMode to the response object for consistency
      newLobby.gameMode = lobbyGameMode
      console.log("Lobby created successfully without gameMode column:", newLobby)
    }

    // Add host as participant
    // Check if participant already exists (shouldn't happen, but safety check)
    const existingParticipant = await db
      .select()
      .from(lobbyParticipants)
      .where(
        and(
          eq(lobbyParticipants.lobbyId, newLobby.id),
          eq(lobbyParticipants.userId, userId)
        )
      )
      .limit(1)

    if (existingParticipant.length === 0) {
      // Use raw SQL directly to avoid Drizzle's default value handling issues
      // Drizzle tries to insert 'default' which PostgreSQL doesn't accept in this context
      await postgresClient`
        INSERT INTO lobby_participants (lobby_id, user_id)
        VALUES (${newLobby.id}::uuid, ${userId}::uuid)
        ON CONFLICT (lobby_id, user_id) DO NOTHING
      `
    }

    // If this is a "Play Again" (copy from existing lobby), invite all previous players
    if (copyFromLobbyId) {
      try {
        console.log("Inviting previous players from lobby:", copyFromLobbyId)
        
        // Get all participants from the old lobby (except the current host)
        const previousParticipants = await db
          .select({
            userId: lobbyParticipants.userId,
            userName: users.name,
          })
          .from(lobbyParticipants)
          .innerJoin(users, eq(lobbyParticipants.userId, users.id))
          .where(
            and(
              eq(lobbyParticipants.lobbyId, copyFromLobbyId),
              ne(lobbyParticipants.userId, userId) // Exclude current host
            )
          )

        console.log("Previous participants found:", previousParticipants.length)

        // Send Play Again invitation to each previous participant
        if (previousParticipants.length > 0) {
          const hostName = dbUser[0].name
          
          // Get category display name
          const categoryDisplay = lobbyCategory || "all"
          
          // Format: __PLAY_AGAIN_INVITE__:hostName:lobbyId:maxRounds:category
          const inviteMessage = `__PLAY_AGAIN_INVITE__:${hostName}:${newLobby.id}:${maxRounds}:${categoryDisplay}`

          for (const participant of previousParticipants) {
            try {
              // Send invitation message
              await db.insert(userMessages).values({
                senderId: userId,
                recipientId: participant.userId,
                content: inviteMessage,
                lobbyId: newLobby.id,
              })
              console.log(`Sent Play Again invite to ${participant.userName} (${participant.userId})`)
            } catch (msgError) {
              console.error(`Failed to send invite to ${participant.userName}:`, msgError)
              // Continue with other invites even if one fails
            }
          }
        }
      } catch (inviteError) {
        console.error("Error inviting previous players:", inviteError)
        // Don't fail the lobby creation if invites fail
      }
    }

    return NextResponse.json(
      {
        lobbyId: newLobby.id,
        lobby: {
          id: newLobby.id,
          hostId: newLobby.hostId,
          category: newLobby.category,
          maxRounds: newLobby.maxRounds,
          gameMode: newLobby.gameMode || lobbyGameMode,
          createdAt: newLobby.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    // Extract PostgreSQL error details
    const pgError = error?.cause || error
    const drizzleError = error
    
    // Comprehensive error logging
    console.error("=".repeat(80))
    console.error("❌ LOBBY CREATION FAILED")
    console.error("=".repeat(80))
    console.error("📋 Drizzle Error:", {
      message: drizzleError?.message,
      query: drizzleError?.query,
      params: drizzleError?.params,
      constructor: drizzleError?.constructor?.name,
    })
    console.error("📋 PostgreSQL Error:", {
      message: pgError?.message,
      code: pgError?.code,
      detail: pgError?.detail,
      hint: pgError?.hint,
      severity: pgError?.severity,
      position: pgError?.position,
      table: pgError?.table,
      column: pgError?.column,
      schema: pgError?.schema,
      constraint: pgError?.constraint,
      routine: pgError?.routine,
      file: pgError?.file,
      line: pgError?.line,
    })
    console.error("📋 Request Data:", {
      maxRounds,
      category: lobbyCategory,
      gameMode: lobbyGameMode,
      userId,
    })
    console.error("📋 Full Error Object:", error)
    console.error("=".repeat(80))
    
    // Determine error type and provide helpful message
    const errorMessage = pgError?.message || drizzleError?.message || "Unknown error"
    const errorCode = pgError?.code
    const isColumnError = 
      errorMessage.includes("game_mode") ||
      errorMessage.includes("column") ||
      errorMessage.includes("does not exist") ||
      errorCode === "42703" // undefined_column
    
    let userFriendlyMessage = errorMessage
    if (isColumnError) {
      userFriendlyMessage = `Database schema error: The 'game_mode' column doesn't exist in the 'lobbies' table. Please run the migration: ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS game_mode VARCHAR(20) DEFAULT 'multi-device' NOT NULL;`
    }
    
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: userFriendlyMessage,
          pgCode: errorCode,
          pgDetail: pgError?.detail,
          pgHint: pgError?.hint,
          drizzleQuery: drizzleError?.query,
          drizzleParams: drizzleError?.params,
          details: process.env.NODE_ENV === "development" ? {
            stack: error?.stack,
            fullError: error,
          } : undefined,
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}

