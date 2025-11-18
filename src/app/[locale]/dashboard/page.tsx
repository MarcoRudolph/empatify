import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { DotPattern } from '@/components/ui/dot-pattern';
import { Navbar } from '@/components/ui/Navbar';
import { SpotifyLinkButton } from '@/components/spotify/SpotifyLinkButton';
import { CreateGameSection } from './CreateGameSection';
import { Users, Music, Search, UserPlus, TrendingUp } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

  // TODO: Fetch actual data from database
  // For now, we'll show placeholder content
  const lobbies: any[] = [];
  const friends: any[] = [];
  const miniStats = {
    gamesPlayed: 0,
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
        </div>

        {/* Main Grid - Mobile: stacked, Desktop: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Lobbies & Create Game */}
          <div className="lg:col-span-2 space-y-8">
            {/* Lobbies */}
            <MagicCard
              className="p-8 rounded-2xl shadow-lg"
              gradientFrom="#FF6B00"
              gradientTo="#E65F00"
              gradientSize={400}
            >
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                {t('lobbies')}
              </h2>

              {lobbies.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="size-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-500">
                    {t('noLobbies')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lobby cards would go here */}
                </div>
              )}
            </MagicCard>

            {/* Create Game Section */}
            <CreateGameSection 
              isSpotifyLinked={isSpotifyLinked}
              isProPlan={isProPlan}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Mini Stats */}
            <MagicCard
              className="p-8 rounded-2xl shadow-lg"
              gradientFrom="#2DB4FF"
              gradientTo="#1A8FCC"
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
              gradientFrom="#FF6B00"
              gradientTo="#E65F00"
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

