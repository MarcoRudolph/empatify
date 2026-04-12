import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { CheckCircle2, Zap, Music2, Star, Sparkles, Trophy, Users } from 'lucide-react';

/** Flower-of-life derived icon — 7 overlapping circles, stroke only */
function FlowerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="2 1 36 38"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <circle cx="20" cy="20" r="9" strokeOpacity="0.9" />
      <circle cx="20" cy="11" r="9" strokeOpacity="0.65" />
      <circle cx="27.8" cy="15.5" r="9" strokeOpacity="0.65" />
      <circle cx="27.8" cy="24.5" r="9" strokeOpacity="0.65" />
      <circle cx="20" cy="29" r="9" strokeOpacity="0.65" />
      <circle cx="12.2" cy="24.5" r="9" strokeOpacity="0.65" />
      <circle cx="12.2" cy="15.5" r="9" strokeOpacity="0.65" />
    </svg>
  );
}

export default async function StripeSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('common');

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-500/20 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-spotify/15 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-xl w-full text-center space-y-10">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
             <div className="spin-slow text-primary-500 size-16">
                <FlowerIcon className="size-16" />
             </div>
             <div className="absolute -bottom-1 -right-1 bg-accent-spotify rounded-full p-1 shadow-lg ring-4 ring-neutral-50">
               <CheckCircle2 className="size-5 text-neutral-50" />
             </div>
          </div>
          <div className="space-y-1">
            <span className="font-display text-xl font-black tracking-tight text-neutral-900 uppercase opacity-50">
              empatify
            </span>
            <h1 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-neutral-900 leading-none">
              Welcome to <span className="text-primary-500">Pro</span>
            </h1>
          </div>
        </div>

        {/* Benefits Grid - Magic UI inspired */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="group relative p-6 rounded-2xl bg-neutral-100 border border-neutral-200 shadow-sm transition-all duration-300 hover:border-primary-500/50 hover:shadow-primary-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative flex flex-col items-center md:items-start text-center md:text-left gap-3">
              <div className="size-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <Users className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">Unlimited Players</h3>
                <p className="text-sm text-neutral-500">Invite everyone. No more limits on lobby size.</p>
              </div>
            </div>
          </div>

          <div className="group relative p-6 rounded-2xl bg-neutral-100 border border-neutral-200 shadow-sm transition-all duration-300 hover:border-accent-spotify/50 hover:shadow-accent-spotify/10">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-spotify/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative flex flex-col items-center md:items-start text-center md:text-left gap-3">
              <div className="size-10 rounded-xl bg-accent-spotify/10 flex items-center justify-center text-accent-spotify">
                <Sparkles className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">Premium Game Modes</h3>
                <p className="text-sm text-neutral-500">Round Prompts & Blind Mode. Fresh ways to play.</p>
              </div>
            </div>
          </div>

          <div className="group relative p-6 rounded-2xl bg-neutral-100 border border-neutral-200 shadow-sm transition-all duration-300 hover:border-primary-500/50 hover:shadow-primary-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative flex flex-col items-center md:items-start text-center md:text-left gap-3">
              <div className="size-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <Trophy className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">Stats & History</h3>
                <p className="text-sm text-neutral-500">Full game history and Top 5 songs statistics.</p>
              </div>
            </div>
          </div>

          <div className="group relative p-6 rounded-2xl bg-neutral-100 border border-neutral-200 shadow-sm transition-all duration-300 hover:border-accent-spotify/50 hover:shadow-accent-spotify/10">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-spotify/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative flex flex-col items-center md:items-start text-center md:text-left gap-3">
              <div className="size-10 rounded-xl bg-accent-spotify/10 flex items-center justify-center text-accent-spotify">
                <Music2 className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">Full Export</h3>
                <p className="text-sm text-neutral-500">Export every song from every game to Spotify.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="group relative inline-flex items-center justify-center h-14 px-10 rounded-full bg-primary-500 text-neutral-50 font-black text-lg tracking-tight shadow-xl shadow-primary-500/20 hover:bg-primary-600 hover:shadow-primary-600/30 active:scale-95 transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center gap-2">
              Back to Dashboard
              <Zap className="size-5 fill-neutral-50" />
            </span>
          </Link>
          <p className="text-xs text-neutral-500 font-medium">
            Your Pro features are active immediately. Have fun!
          </p>
        </div>

      </div>
    </div>
  );
}
