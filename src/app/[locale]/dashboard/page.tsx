import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { DotPattern } from '@/components/ui/dot-pattern';
import { Navbar } from '@/components/ui/Navbar';
import { SpotifyLinkButton } from '@/components/spotify/SpotifyLinkButton';
import { CreateGameSection } from './CreateGameSection';
import { CreateGameButton } from './CreateGameButton';
import { LobbyMenu } from './LobbyMenu';
import { Users, Music, Search, UserPlus, TrendingUp } from 'lucide-react';
import { Link } from '@/i18n/routing';
import NextLink from 'next/link';
import { db } from '@/lib/db';
import { users, lobbies, lobbyParticipants, songs, ratings } from '@/lib/db/schema';
import { eq, or, desc, and, inArray } from 'drizzle-orm';

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
  // Select only basic columns first to avoid Spotify column errors
  let dbUser: any = null;
  let isSpotifyLinked = false;

  try {
    // First, try to get basic user info
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

    // Try to check Spotify columns separately (they might not exist)
    if (dbUser) {
      try {
        const spotifyRecord = await db
          .select({
            spotifyAccessToken: users.spotifyAccessToken,
            spotifyRefreshToken: users.spotifyRefreshToken,
          })
          .from(users)
          .where(eq(users.id, dbUser.id))
          .limit(1);

        if (spotifyRecord.length > 0 && spotifyRecord[0]) {
          const spotify = spotifyRecord[0];
          // User is linked if they have both access and refresh tokens
          isSpotifyLinked =
            !!spotify.spotifyAccessToken && !!spotify.spotifyRefreshToken;
        }
      } catch (spotifyError: any) {
        // Spotify columns don't exist, so Spotify is not linked
        if (
          spotifyError.message?.includes("spotify") ||
          spotifyError.message?.includes("column")
        ) {
          console.warn(
            "Spotify columns not found. Please run the migration."
          );
          isSpotifyLinked = false;
        } else {
          // Re-throw other errors
          throw spotifyError;
        }
      }
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
        isSpotifyLinked = false;
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
                ratingValue: ratings.ratingValue,
              })
              .from(ratings)
              .where(inArray(ratings.songId, songIds))
          }
          
          // Calculate average rating
          const averageRating = lobbyRatings.length > 0
            ? lobbyRatings.reduce((sum, r) => sum + r.ratingValue, 0) / lobbyRatings.length
            : 0
          
          // Get participants for this lobby
          const lobbyParticipantsList = await db
            .select({
              userId: lobbyParticipants.userId,
            })
            .from(lobbyParticipants)
            .where(eq(lobbyParticipants.lobbyId, lobby.id))
          
          const participantIds = lobbyParticipantsList.map(p => p.userId)
          const participantCount = participantIds.length
          
          // Determine current round and status
          let currentRound = 1
          let status: 'not_started' | 'running' | 'finished' = 'not_started'
          let needsSongSelection = false
          
          if (lobbySongs.length === 0) {
            // No songs yet - not started
            status = 'not_started'
            currentRound = 1
            needsSongSelection = true
          } else {
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
                  // Check if all songs have been rated (simplified: if there are ratings, consider it finished)
                  if (lobbyRatings.length > 0) {
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
            
            // If we completed all rounds, mark as finished
            if (currentRound > lobby.maxRounds || (currentRound === lobby.maxRounds && !needsSongSelection && lobbyRatings.length > 0)) {
              status = 'finished'
              currentRound = lobby.maxRounds
              needsSongSelection = false
            }
          }
          
          // Add enriched data to lobby
          lobby.averageRating = averageRating
          lobby.status = status
          lobby.currentRound = currentRound
          lobby.needsSongSelection = needsSongSelection
          lobby.participantCount = participantCount
        } catch (error) {
          console.error(`Error enriching lobby ${lobby.id}:`, error)
          // Set defaults on error
          lobby.averageRating = 0
          lobby.status = 'not_started'
          lobby.currentRound = 1
          lobby.needsSongSelection = false
        }
      }
    }
  } catch (error) {
    console.error("Error fetching lobbies:", error)
    userLobbies = []
  }

  const friends: any[] = [];
  const miniStats = {
    gamesPlayed: userLobbies.length,
    averageRating: 0,
    songsSuggested: 0,
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
          {/* Link Spotify Button */}
          <SpotifyLinkButton locale={locale} />
          
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
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                {t('lobbies')}
              </h2>

              {userLobbies.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="size-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-500">
                    {t('noLobbies')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userLobbies.map((lobby) => {
                    // Map category to translation key
                    const getCategoryLabel = (cat: string | null) => {
                      if (!cat) return tLobby('categoryAll');
                      // Handle special cases like "hiphop-rnb"
                      const categoryMap: Record<string, string> = {
                        'hiphop-rnb': 'categoryHipHopRnB',
                        '60s': 'category60s',
                        '70s': 'category70s',
                        '80s': 'category80s',
                        '90s': 'category90s',
                        '2000s': 'category2000s',
                        '2010s': 'category2010s',
                        '2020s': 'category2020s',
                      };
                      const key = categoryMap[cat] || `category${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
                      return tLobby(key as any) || cat;
                    };
                    
                    // Get status label and color
                    const getStatusInfo = (status: string) => {
                      switch (status) {
                        case 'running':
                          return { label: t('lobbyRunning'), bgColor: 'bg-green-500', textColor: 'text-white' }
                        case 'finished':
                          return { label: t('lobbyFinished'), bgColor: 'bg-neutral-500', textColor: 'text-white' }
                        default:
                          return { label: t('lobbyNotStarted'), bgColor: 'bg-yellow-500', textColor: '!text-neutral-900' }
                      }
                    }
                    
                    const statusInfo = getStatusInfo(lobby.status || 'not_started')
                    
                    return (
                      <NextLink
                        key={lobby.id}
                        href={`/lobby/${lobby.id}`}
                        className="block p-4 bg-neutral-100 hover:bg-neutral-200 rounded-lg border border-neutral-300 transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-neutral-900 group-hover:text-primary-500 transition-colors">
                                {getCategoryLabel(lobby.category)} • {lobby.maxRounds} {tLobby('rounds')}
                              </h3>
                              {lobby.hostId === dbUser?.id && (
                                <span className="px-2 py-1 text-xs font-medium bg-primary-500 text-neutral-900 rounded shrink-0">
                                  {tLobby('host')}
                                </span>
                              )}
                              <span 
                                className={`px-2 py-1 text-xs font-medium rounded shrink-0 ${statusInfo.bgColor}`}
                                style={statusInfo.bgColor === 'bg-yellow-500' ? { color: '#171717' } : { color: '#ffffff' }}
                              >
                                {statusInfo.label}
                              </span>
                            </div>
                            
                            {/* Status and Round Info */}
                            <div className="flex items-center gap-4 flex-wrap text-sm text-neutral-600 mb-2">
                              {lobby.status === 'running' && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">{t('currentRound')}:</span>
                                  <span>{lobby.currentRound || 1} / {lobby.maxRounds}</span>
                                </span>
                              )}
                              {lobby.averageRating > 0 && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">{t('averageRating')}:</span>
                                  <span>{(lobby.averageRating || 0).toFixed(1)} / 10</span>
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-neutral-500">
                              {new Date(lobby.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          
                          {/* Icons and Menu */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Icon - Only one icon: yellow if song selection needed, grey music note otherwise */}
                            {lobby.needsSongSelection ? (
                              <div className="text-yellow-500" title={t('selectSongForRound')}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.544 1.056a3 3 0 0 1-3 3v1a3 3 0 0 1 3 3h1a3 3 0 0 1 3-3v-1a3 3 0 0 1-3-3zm-4.1 7.056v1.944H6.39v2H4.445V14h-2v-1.944H.5v-2h1.944V8.112zm4.579 1.444v5.979a4 4 0 1 0 2 3.465v-8.28l10-3.333v5.148a4 4 0 1 0 2 3.465V1.113l-8.979 2.992v2.451h-1.5a1.5 1.5 0 0 0-1.5 1.5v1.5z" clipRule="evenodd"/>
                                </svg>
                              </div>
                            ) : (
                              <Music className="size-5 text-neutral-400 group-hover:text-primary-500 transition-colors" />
                            )}
                            
                            {/* Menu */}
                            <LobbyMenu
                              lobbyId={lobby.id}
                              isHost={lobby.hostId === dbUser?.id}
                              participantCount={lobby.participantCount || 0}
                              locale={locale}
                            />
                          </div>
                        </div>
                      </NextLink>
                    );
                  })}
                </div>
              )}
            </MagicCard>

            {/* Create Game Section */}
            <div id="create-game" className="scroll-mt-24">
              <CreateGameSection 
                isSpotifyLinked={isSpotifyLinked}
                isProPlan={isProPlan}
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

              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="size-10 text-neutral-400 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500 mb-4">
                    {tFriends('noFriends')}
                  </p>
                  <button className="text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors duration-200">
                    {t('userSearch')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Friend cards would go here */}
                </div>
              )}
            </MagicCard>
          </div>
        </div>
      </div>
    </div>
  );
}

