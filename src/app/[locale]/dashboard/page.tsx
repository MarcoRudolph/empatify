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
import { eq, or, desc, and, inArray, sql } from 'drizzle-orm';
import { LobbyList } from './LobbyList'
import { fetchDashboardData } from './fetchDashboardData';
import { withCache } from '@/lib/cache';

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
    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User";

    // Atomic upsert: insert on first visit, no-op on subsequent visits.
    // Avoids the SELECT→INSERT race condition when parallel requests all see
    // an empty cache and simultaneously attempt to create the same user.
    const userRecord = await withCache(
      `user:profile:${user.id}`,
      300,
      () =>
        db
          .insert(users)
          .values({
            email: user.email!,
            name: displayName,
            avatarUrl: user.user_metadata?.avatar_url || null,
          })
          .onConflictDoUpdate({
            target: users.email,
            // SET email = EXCLUDED.email is a deliberate no-op: it keeps the
            // existing row untouched while RETURNING still gives us the row.
            set: { email: sql`excluded.email` },
          })
          .returning({
            id: users.id,
            email: users.email,
            name: users.name,
            avatarUrl: users.avatarUrl,
            proPlan: users.proPlan,
            createdAt: users.createdAt,
          })
    );

    dbUser = userRecord[0];
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

  // Fetch dashboard data in 3 parallel rounds (no N+1)
  let userLobbies: any[] = []
  let userFriends: any[] = []
  let miniStats = { gamesPlayed: 0, averageRating: 0, songsSuggested: 0 }

  if (dbUser?.id) {
    try {
      const dashData = await fetchDashboardData(dbUser.id)
      userLobbies = dashData.userLobbies
      userFriends = dashData.userFriends
      miniStats = dashData.miniStats
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }


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
          <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight text-neutral-900 mb-3">
            {t('title')}
          </h1>
          <p className="text-lg text-neutral-500 leading-relaxed">
            {t('welcomeBack')}, <span className="font-semibold text-neutral-700">{user.email?.split('@')[0]}</span>
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
                <h2 className="font-display text-2xl font-black text-neutral-900 tracking-tight">
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
              className="p-6 rounded-2xl shadow-lg"
              gradientFrom="var(--color-accent-blue)"
              gradientTo="var(--color-accent-blue)"
              gradientSize={300}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <TrendingUp className="size-5 text-accent-blue shrink-0" />
                <h2 className="font-display text-lg font-black text-neutral-900 tracking-tight">
                  {t('miniStats')}
                </h2>
              </div>
              <div className="grid grid-cols-3 divide-x divide-neutral-200">
                <div className="text-center px-2">
                  <p className="font-display text-4xl font-black text-accent-blue leading-none mb-1.5">
                    {miniStats.gamesPlayed}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Spiele
                  </p>
                </div>
                <div className="text-center px-2">
                  <p className="font-display text-4xl font-black text-accent-blue leading-none mb-1.5">
                    {miniStats.averageRating.toFixed(1)}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Ø Wertung
                  </p>
                </div>
                <div className="text-center px-2">
                  <p className="font-display text-4xl font-black text-accent-blue leading-none mb-1.5">
                    {miniStats.songsSuggested}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Songs
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
                  <Users className="size-5 text-primary-500" />
                  <h2 className="font-display text-lg font-black text-neutral-900 tracking-tight">
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

