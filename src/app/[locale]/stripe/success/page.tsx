import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { CheckCircle2, Zap, Music2, Star, Sparkles, Trophy, Users } from 'lucide-react';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';

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

  const benefits = [
    {
      title: "Unlimited Players",
      description: "Invite everyone. No more limits on lobby size.",
      icon: Users,
      color: "#FF6B00" // primary-500
    },
    {
      title: "Premium Game Modes",
      description: "Round Prompts & Blind Mode. Fresh ways to play.",
      icon: Sparkles,
      color: "#1DB954" // spotify-accent
    },
    {
      title: "Stats & History",
      description: "Full game history and Top 5 songs statistics.",
      icon: Trophy,
      color: "#FF6B00"
    },
    {
      title: "Full Export",
      description: "Export every song from every game to Spotify.",
      icon: Music2,
      color: "#1DB954"
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows - subtle and vibrant */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-500/20 blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-spotify/15 blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-12">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <div className="spin-slow text-primary-500 size-24">
                <FlowerIcon className="size-24" />
             </div>
             <div className="absolute -bottom-1 -right-1 bg-accent-spotify rounded-full p-2 shadow-lg ring-8 ring-neutral-50">
               <CheckCircle2 className="size-8 text-neutral-900" />
             </div>
          </div>
          <div className="space-y-3">
            <span className="font-display text-2xl font-black tracking-widest text-primary-500 uppercase opacity-80">
              PRO ACCESS
            </span>
            <h1 className="font-display text-6xl md:text-7xl font-black tracking-tighter text-neutral-900 leading-none">
              Welcome aboard<span className="text-primary-500">.</span>
            </h1>
          </div>
        </div>

        {/* Benefits Grid - Glassmorphism + Magic UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((benefit) => (
            <MagicCard 
              key={benefit.title}
              className="p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col items-center md:items-start text-center md:text-left gap-4 transition-all hover:scale-[1.02]"
              gradientFrom={benefit.color}
              gradientTo="transparent"
              gradientSize={200}
              gradientOpacity={0.3}
            >
              <div 
                className="size-14 rounded-2xl flex items-center justify-center shadow-lg shadow-black/20"
                style={{ backgroundColor: benefit.color, color: '#FFFFFF' }}
              >
                <benefit.icon className="size-7" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xl mb-1">{benefit.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            </MagicCard>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center gap-6 pt-6">
          <Link href="/dashboard" className="w-full max-w-[440px]">
            <ShimmerButton
              background="#FF6B00" // Explicit orange
              shimmerColor="#FFFFFF"
              borderRadius="9999px"
              className="w-full h-16 font-black text-xl tracking-tight shadow-2xl shadow-primary-500/40"
            >
              <div className="flex items-center gap-3 text-white">
                Back to Dashboard
                <Zap className="size-6 fill-white" />
              </div>
            </ShimmerButton>
          </Link>
          <p className="text-base text-neutral-500 font-medium">
            Your Pro features are active immediately. Have fun!
          </p>
        </div>

      </div>
    </div>
  );
}
