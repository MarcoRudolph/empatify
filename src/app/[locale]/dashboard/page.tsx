import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { DotPattern } from '@/components/ui/dot-pattern';
import { Navbar } from '@/components/ui/Navbar';
import { CreateGameSection } from './CreateGameSection';
import { CreateGameButton } from './CreateGameButton';
import { LobbyMenu } from './LobbyMenu';
import { Users, Music, Search, UserPlus, TrendingUp, Calendar, Star, Trophy, Filter } from 'lucide-react';
import { Link } from '@/i18n/routing';
import NextLink from 'next/link';
import { db } from '@/lib/db';
import { users, lobbies, lobbyParticipants, songs, ratings, friends } from '@/lib/db/schema';
import { eq, or, desc, and, inArray } from 'drizzle-orm';
import { LobbyList } from './LobbyList';

/**
 * Dashboard page - Main hub for users after login
 * Features: Lobby overview, User search, Friends list, Spotify linking, Mini stats
 */
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('dashboard');
  const tCommon = await getTranslations('common');
  const tFriends = await getTranslations('friends');
  const tLobby = await getTranslations('lobby');

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get or create user record from database
  let dbUser: any = null;

  try {
    // Get basic user info
    const userRecord = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        proPlan: users.proPlan,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1);

    if (userRecord.length === 0) {
      // If user doesn't exist in database, create them
      const displayName =
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User";
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
          avatarUrl: users.avatarUrl,
          proPlan: users.proPlan,
          createdAt: users.createdAt,
        });
      dbUser = newUser;
    } else {
      dbUser = userRecord[0];
    }
  } catch (error: any) {
    // DrizzleQueryError has a 'cause' property with the actual PostgreSQL error
    const pgError = error?.cause || error;
    
    // Log detailed error information
    console.error("Database error in dashboard:", {
      drizzleMessage: error?.message,
      drizzleQuery: error?.query,
      drizzleParams: error?.params,
      pgMessage: pgError?.message,
      pgCode: pgError?.code,
      pgDetail: pgError?.detail,
      pgHint: pgError?.hint,
      pgSeverity: pgError?.severity,
      pgPosition: pgError?.position,
      pgTable: pgError?.table,
      pgColumn: pgError?.column,
      pgSchema: pgError?.schema,
      pgConstraint: pgError?.constraint,
      pgRoutine: pgError?.routine,
      pgFile: pgError?.file,
      pgLine: pgError?.line,
      fullError: error,
    });

    // Extract error messages from both Drizzle and PostgreSQL error
    const drizzleMessage = error?.message || "";
    const pgMessage = pgError?.message || "";
    const errorMessage = pgMessage || drizzleMessage;
    const errorCode = pgError?.code || error?.code;
    
    // Check for max clients / connection pool errors
    const isMaxClientsError =
      errorMessage.includes("MaxClientsInSessionMode") ||
      errorMessage.includes("max clients reached") ||
      errorMessage.includes("too many clients") ||
      errorCode === "53300"; // too_many_connections
    
    if (isMaxClientsError) {
      console.error(
        "Database connection pool exhausted - too many concurrent connections"
      );
      throw new Error(
        `Database connection limit reached. Please wait a moment and try again. The system is handling too many requests simultaneously.`
      );
    }

    // Check for connection errors
    const isConnectionError =
      errorMessage.includes("timeout") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("ETIMEDOUT") ||
      errorMessage.includes("getaddrinfo") ||
      errorMessage.includes("connect") ||
      errorCode === "ECONNREFUSED" ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "ENOTFOUND" ||
      errorCode === "08006"; // connection_failure

    if (isConnectionError) {
      console.error(
        "Database connection error - Supabase may be down or DATABASE_URL is incorrect"
      );
      throw new Error(
        `Database connection failed. Please check if Supabase is running and DATABASE_URL is configured correctly. PostgreSQL Error: ${pgMessage || errorMessage} (Code: ${errorCode || "N/A"})`
      );
    }

    // Check if it's a table/column doesn't exist error
    const isTableError = 
      errorMessage.includes("does not exist") ||
      errorMessage.includes("relation") ||
      errorMessage.includes("column") ||
      errorCode === "42P01" || // undefined_table
      errorCode === "42703" || // undefined_column
      errorCode === "42P07";   // duplicate_table

    if (isTableError) {
      console.error("Database schema error - tables or columns may not exist", {
        pgError: pgError,
        errorCode: errorCode,
        table: pgError?.table,
        column: pgError?.column,
      });
      throw new Error(
        `Database schema error. The users table or required columns may not exist. Please run the database migrations. PostgreSQL Error: ${pgMessage || errorMessage} (Code: ${errorCode || "N/A"})${pgError?.hint ? `. Hint: ${pgError.hint}` : ""}`
      );
    }

    // If error is about missing columns, try to continue without them
    if (errorMessage.includes("spotify") || errorMessage.includes("column")) {
      console.warn("Database error (possibly missing columns):", errorMessage);
      // Try to get user without Spotify columns
      try {
        const userRecord = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            avatarUrl: users.avatarUrl,
            proPlan: users.proPlan,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);
        dbUser = userRecord.length > 0 ? userRecord[0] : null;
      } catch (retryError: any) {
        console.error("Failed to fetch user on retry:", retryError);
        throw new Error(
          `Database error: ${retryError?.message || "Unknown error"}. Please check your database connection and ensure the users table exists.`
        );
      }
    } else {
      // Re-throw other errors with more context
      throw new Error(
        `Database error: ${errorMessage || "Unknown error"}. Code: ${error?.code || "N/A"}. Please check your database connection and schema.`
      );
    }
  }

  // Check if user has Pro Plan
  const isProPlan = dbUser?.proPlan || false;

  // Fetch lobbies where user is host or participant
  let userLobbies: any[] = [];
  try {
    if (dbUser?.id) {
      // Get lobbies where user is host
      const hostedLobbies = await db
        .select({
          id: lobbies.id,
          hostId: lobbies.hostId,
          category: lobbies.category,
          maxRounds: lobbies.maxRounds,
          gameMode: lobbies.gameMode,
          createdAt: lobbies.createdAt,
        })
        .from(lobbies)
        .where(eq(lobbies.hostId, dbUser.id))
        .orderBy(desc(lobbies.createdAt))

      // Get lobbies where user is participant
      const participantLobbies = await db
        .select({
          id: lobbies.id,
          hostId: lobbies.hostId,
          category: lobbies.category,
          maxRounds: lobbies.maxRounds,
          gameMode: lobbies.gameMode,
          createdAt: lobbies.createdAt,
        })
        .from(lobbyParticipants)
        .innerJoin(lobbies, eq(lobbyParticipants.lobbyId, lobbies.id))
        .where(eq(lobbyParticipants.userId, dbUser.id))
        .orderBy(desc(lobbies.createdAt))

      // Combine and deduplicate (user might be both host and participant)
      const allLobbyIds = new Set<string>()
      hostedLobbies.forEach(l => allLobbyIds.add(l.id))
      participantLobbies.forEach(l => {
        if (!allLobbyIds.has(l.id)) {
          allLobbyIds.add(l.id)
        }
      })
      
      // Create map to prioritize hosted lobbies (they appear first)
      const lobbyMap = new Map<string, any>()
      hostedLobbies.forEach(l => lobbyMap.set(l.id, l))
      participantLobbies.forEach(l => {
        if (!lobbyMap.has(l.id)) {
          lobbyMap.set(l.id, l)
        }
      })
      
      userLobbies = Array.from(lobbyMap.values())
      // Sort by creation date (newest first)
      userLobbies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      // Enrich lobbies with additional data: average rating, status, current round, needs song selection
      for (const lobby of userLobbies) {
        try {
          // Get all songs for this lobby
          const lobbySongs = await db
            .select({
              id: songs.id,
              roundNumber: songs.roundNumber,
              suggestedBy: songs.suggestedBy,
            })
            .from(songs)
            .where(eq(songs.lobbyId, lobby.id))
          
          // Get all ratings for these songs
          let lobbyRatings: any[] = []
          if (lobbySongs.length > 0) {
            const songIds = lobbySongs.map(s => s.id)
            lobbyRatings = await db
              .select({
                songId: ratings.songId,
                ratingValue: ratings.ratingValue,
                givenBy: ratings.givenBy,
              })
              .from(ratings)
              .where(inArray(ratings.songId, songIds))
          }
          
          // Calculate average rating
          const averageRating = lobbyRatings.length > 0
            ? lobbyRatings.reduce((sum, r) => sum + r.ratingValue, 0) / lobbyRatings.length
            : 0
          
          // Get participants for this lobby with user details
          const lobbyParticipantsList = await db
            .select({
              userId: lobbyParticipants.userId,
              userName: users.name,
              userAvatarUrl: users.avatarUrl,
            })
            .from(lobbyParticipants)
            .innerJoin(users, eq(lobbyParticipants.userId, users.id))
            .where(eq(lobbyParticipants.lobbyId, lobby.id))
          
          const participantIds = lobbyParticipantsList.map(p => p.userId)
          const participantCount = participantIds.length
          
          // Calculate leaderboard
          const leaderboardMap = new Map<
            string,
            { userId: string; name: string; avatarUrl: string | null; totalRating: number; count: number }
          >()
          
          // Initialize leaderboard entries for all participants
          lobbyParticipantsList.forEach((participant) => {
            leaderboardMap.set(participant.userId, {
              userId: participant.userId,
              name: participant.userName,
              avatarUrl: participant.userAvatarUrl,
              totalRating: 0,
              count: 0,
            })
          })
          
          // Calculate ratings per user
          lobbySongs.forEach((song) => {
            const songRatings = lobbyRatings.filter((r) => r.songId === song.id)
            songRatings.forEach((rating) => {
              const entry = leaderboardMap.get(song.suggestedBy)
              if (entry) {
                entry.totalRating += rating.ratingValue
                entry.count++
              }
            })
          })
          
          // Convert to array and calculate averages, sort by average rating
          const leaderboard = Array.from(leaderboardMap.values())
            .map((entry) => ({
              userId: entry.userId,
              name: entry.name,
              avatarUrl: entry.avatarUrl,
              averageRating: entry.count > 0 ? entry.totalRating / entry.count : 0,
            }))
            .sort((a, b) => b.averageRating - a.averageRating)
          
          // Get top 3 (or top 2 if only 2 participants)
          const topPlayers = participantCount >= 3 
            ? leaderboard.slice(0, 3) 
            : participantCount >= 2 
            ? leaderboard.slice(0, 2)
            : []
          
          // Find the round where user still needs to rate songs
          // Check each round for songs that the user hasn't rated yet
          let roundToRate: number | null = null
          if (lobbySongs.length > 0 && participantCount > 1) {
            // Get all songs the user has rated
            const userRatings = lobbyRatings.filter(r => r.givenBy === dbUser.id)
            const ratedSongIds = new Set(userRatings.map(r => r.songId))
            
            // Find the lowest round where there are songs the user hasn't rated
            for (let round = 1; round <= lobby.maxRounds; round++) {
              const roundSongs = lobbySongs.filter(s => s.roundNumber === round)
              
              // Check if there are songs in this round that the user hasn't rated
              // and that are not the user's own songs
              const songsToRate = roundSongs.filter(song => 
                !ratedSongIds.has(song.id) && song.suggestedBy !== dbUser.id
              )
              
              if (songsToRate.length > 0) {
                roundToRate = round
                break
              }
            }
          }
          
          // Determine current round and status
          let currentRound = 1
          let status: 'not_started' | 'running' | 'finished' = 'not_started'
          let needsSongSelection = false
          
          if (lobbySongs.length === 0) {
            // No songs yet - not started
            status = 'not_started'
            currentRound = 1
            needsSongSelection = true
          } else if (participantCount <= 1) {
            // Not enough players - not started
            status = 'not_started'
            currentRound = 1
            needsSongSelection = true
          } else {
            // At least one song and more than 1 player - running
            status = 'running'
            
            // Find the current round - the lowest round where not all participants have songs
            for (let round = 1; round <= lobby.maxRounds; round++) {
              const roundSongs = lobbySongs.filter(s => s.roundNumber === round)
              const participantsWithSongs = new Set(roundSongs.map(s => s.suggestedBy))
              
              // Check if current user needs to select a song for this round
              if (!participantsWithSongs.has(dbUser.id)) {
                currentRound = round
                needsSongSelection = true
                break
              }
              
              // If all participants have songs for this round
              if (participantsWithSongs.size === participantCount) {
                // Check if this is the last round
                if (round === lobby.maxRounds) {
                  // Check if ALL songs have been rated by ALL participants (except creator)
                  // For each song: (participantCount - 1) ratings expected
                  const expectedRatingsPerSong = participantCount - 1
                  const totalExpectedRatings = lobbySongs.length * expectedRatingsPerSong
                  
                  // Create a map of actual ratings per song
                  const ratingsPerSong = new Map<string, number>()
                  lobbyRatings.forEach((rating) => {
                    const count = ratingsPerSong.get(rating.songId) || 0
                    ratingsPerSong.set(rating.songId, count + 1)
                  })
                  
                  // Check if ALL songs have been rated by ALL participants (except creator)
                  const allSongsRated = lobbySongs.every((song) => {
                    const ratingCount = ratingsPerSong.get(song.id) || 0
                    return ratingCount >= expectedRatingsPerSong
                  })
                  
                  if (allSongsRated) {
                    status = 'finished'
                    currentRound = round
                    needsSongSelection = false
                    break
                  } else {
                    currentRound = round
                    needsSongSelection = false
                    break
                  }
                } else {
                  // Move to next round
                  currentRound = round + 1
                  // Check if user already has a song for next round
                  const nextRoundSongs = lobbySongs.filter(s => s.roundNumber === round + 1)
                  const nextRoundParticipants = new Set(nextRoundSongs.map(s => s.suggestedBy))
                  if (!nextRoundParticipants.has(dbUser.id)) {
                    needsSongSelection = true
                    break
                  }
                }
              } else {
                // Not all participants have songs for this round
                currentRound = round
                if (!participantsWithSongs.has(dbUser.id)) {
                  needsSongSelection = true
                }
                break
              }
            }
            
            // If we completed all rounds, verify all songs are rated before marking as finished
            if (currentRound > lobby.maxRounds || (currentRound === lobby.maxRounds && !needsSongSelection)) {
              // Double-check: All songs must be fully rated
              const expectedRatingsPerSong = participantCount - 1
              const ratingsPerSong = new Map<string, number>()
              lobbyRatings.forEach((rating) => {
                const count = ratingsPerSong.get(rating.songId) || 0
                ratingsPerSong.set(rating.songId, count + 1)
              })
              
              const allSongsRated = lobbySongs.every((song) => {
                const ratingCount = ratingsPerSong.get(song.id) || 0
                return ratingCount >= expectedRatingsPerSong
              })
              
              if (allSongsRated) {
                status = 'finished'
                currentRound = lobby.maxRounds
                needsSongSelection = false
              }
            }
          }
          
          // Add enriched data to lobby
          lobby.averageRating = averageRating
          lobby.status = status
          lobby.currentRound = currentRound
          lobby.needsSongSelection = needsSongSelection
          lobby.participantCount = participantCount
          lobby.topPlayers = topPlayers
          lobby.roundToRate = roundToRate // Round where user still needs to rate songs
        } catch (error) {
          console.error(`Error enriching lobby ${lobby.id}:`, error)
          // Set defaults on error
          lobby.averageRating = 0
          lobby.status = 'not_started'
          lobby.currentRound = 1
          lobby.needsSongSelection = false
          lobby.topPlayers = []
          lobby.roundToRate = null
        }
      }
    }
  } catch (error) {
    console.error("Error fetching lobbies:", error)
    userLobbies = []
  }

  // Fetch friends
  let userFriends: any[] = []
  try {
    if (dbUser?.id) {
      // Get all friendships where current user is involved (bidirectional)
      const friendships = await db
        .select({
          friendId: friends.friendId,
          userId: friends.userId,
        })
        .from(friends)
        .where(
          or(
            eq(friends.userId, dbUser.id),
            eq(friends.friendId, dbUser.id)
          )
        )

      // Extract all friend IDs (the ones that are not the current user)
      const friendIds = friendships.map(f => 
        f.userId === dbUser.id ? f.friendId : f.userId
      )

      if (friendIds.length > 0) {
        // Get friend user details
        userFriends = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(inArray(users.id, friendIds))
      }
    }
  } catch (error) {
    console.error("Error fetching friends:", error)
    userFriends = []
  }
  // Calculate mini statistics - only count finished games
  const finishedLobbies = userLobbies.filter(lobby => lobby.status === 'finished')
  
  // Calculate total songs suggested by the user across all lobbies
  let totalSongsSuggested = 0
  let totalRatingsReceived = 0
  let totalRatingSum = 0
  
  try {
    if (dbUser?.id) {
      // Get all songs suggested by the user across all lobbies
      const userSongs = await db
        .select({
          id: songs.id,
        })
        .from(songs)
        .where(eq(songs.suggestedBy, dbUser.id))
      
      totalSongsSuggested = userSongs.length
      
      // Get all ratings for those songs
      if (userSongs.length > 0) {
        const songIds = userSongs.map(s => s.id)
        const userRatings = await db
          .select({
            ratingValue: ratings.ratingValue,
          })
          .from(ratings)
          .where(inArray(ratings.songId, songIds))
        
        totalRatingsReceived = userRatings.length
        totalRatingSum = userRatings.reduce((sum, r) => sum + r.ratingValue, 0)
      }
    }
  } catch (error) {
    console.error("Error calculating user stats:", error)
  }
  
  const miniStats = {
    gamesPlayed: finishedLobbies.length,
    averageRating: totalRatingsReceived > 0 ? totalRatingSum / totalRatingsReceived : 0,
    songsSuggested: totalSongsSuggested,
  };

  return (
    <div className="min-h-screen bg-neutral-50 relative overflow-hidden">
      {/* Navbar */}
      <Navbar locale={locale} />

      {/* Background Pattern */}
      <DotPattern
        className="opacity-[0.08]"
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-container mx-auto px-6 pt-24 pb-12 md:pt-28 md:pb-20">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-3">
            {t('title')}
          </h1>
          <p className="text-lg text-neutral-500 leading-relaxed">
            {t('welcomeBack')}, {user.email?.split('@')[0]}!
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          {/* Link Spotify Button - Hidden, using Client Credentials Flow instead */}
          {/* <SpotifyLinkButton locale={locale} /> */}
          
          {/* Create Game Button */}
          <CreateGameButton locale={locale} />
        </div>

        {/* Main Grid - Mobile: stacked, Desktop: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Lobbies & Create Game */}
          <div className="lg:col-span-2 space-y-8">
            {/* Lobbies */}
            <MagicCard
              className="p-8 rounded-2xl shadow-lg"
              gradientFrom="var(--color-primary-500)"
              gradientTo="var(--color-primary-600)"
              gradientSize={400}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">
                  {t('lobbies')}
                </h2>
                {userLobbies.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors" title="Filter">
                      <Filter className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              {userLobbies.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="size-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-500">
                    {t('noLobbies')}
                  </p>
                </div>
              ) : (
                <LobbyList lobbies={userLobbies} user={dbUser} locale={locale} />
              )}
            </MagicCard>

            {/* Create Game Section */}
            <div id="create-game" className="scroll-mt-24">
              <CreateGameSection 
                isProPlan={isProPlan}
                currentUserName={dbUser?.name || "User"}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Mini Stats */}
            <MagicCard
              className="p-8 rounded-2xl shadow-lg"
              gradientFrom="var(--color-accent-blue)"
              gradientTo="var(--color-accent-blue)"
              gradientSize={300}
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="size-6 text-accent-blue" />
                <h2 className="text-2xl font-bold text-neutral-900">
                  {t('miniStats')}
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">
                    {t('gamesPlayed')}
                  </p>
                  <p className="text-3xl font-bold text-accent-blue">
                    {miniStats.gamesPlayed}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">
                    {t('averageRating')}
                  </p>
                  <p className="text-3xl font-bold text-accent-blue">
                    {miniStats.averageRating.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">
                    {t('songsSuggested')}
                  </p>
                  <p className="text-3xl font-bold text-accent-blue">
                    {miniStats.songsSuggested}
                  </p>
                </div>
              </div>
            </MagicCard>

            {/* Friends */}
            <MagicCard
              className="p-8 rounded-2xl shadow-lg"
              gradientFrom="var(--color-primary-500)"
              gradientTo="var(--color-primary-600)"
              gradientSize={300}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="size-6 text-primary-500" />
                  <h2 className="text-2xl font-bold text-neutral-900">
                    {t('friends')}
                  </h2>
                </div>
                <button className="text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors duration-200">
                  <UserPlus className="size-5" />
                </button>
              </div>

              {userFriends.length === 0 ? (
                <div className="text-center py-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="size-16 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 blur-xl"></div>
                    </div>
                    <Users className="relative size-12 text-neutral-400 mx-auto" />
                  </div>
                  <p className="text-sm text-neutral-600 mb-6 font-medium">
                    {tFriends('noFriends')}
                  </p>
                  <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto">
                    <UserPlus className="size-4" />
                    {tFriends('findFriends') || t('userSearch')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
                    >
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.name}
                          className="size-10 rounded-full shrink-0"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 text-sm truncate">
                          {friend.name}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {friend.email}
                        </p>
                      </div>
                      
                      {/* Message Button */}
                      <NextLink
                        href={`/${locale}/messages/${friend.id}`}
                        className="p-2 text-primary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors shrink-0"
                        title={tFriends('sendMessage') || 'Send Message'}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                      </NextLink>
                    </div>
                  ))}
                </div>
              )}
            </MagicCard>
          </div>
        </div>
      </div>
    </div>
  );
}

