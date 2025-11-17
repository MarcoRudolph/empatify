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

  // Fetch user record from database
  // Use try-catch to handle case where Spotify columns don't exist yet
  let dbUser = null;
  let isSpotifyLinked = false;
  
  try {
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1);

    dbUser = userRecord.length > 0 ? userRecord[0] : null;
    
    // Check if Spotify is linked (only if columns exist)
    if (dbUser && 'spotifyAccessToken' in dbUser) {
      isSpotifyLinked =
        !!dbUser.spotifyAccessToken &&
        !!dbUser.spotifyRefreshToken &&
        dbUser.spotifyTokenExpiresAt &&
        new Date(dbUser.spotifyTokenExpiresAt) > new Date();
    }
  } catch (error: any) {
    // If error is about missing columns, Spotify is not linked
    // This handles the case where migration hasn't been run yet
    if (error.message?.includes('spotify') || error.message?.includes('column')) {
      console.warn('Spotify columns not found. Please run the migration:', error.message);
      isSpotifyLinked = false;
    } else {
      // Re-throw other errors
      throw error;
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

