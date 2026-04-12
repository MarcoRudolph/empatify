import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { CheckCircle2, Zap, Music2, Star } from 'lucide-react';

export default async function StripeSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('common');

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent-spotify/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        {/* Animated Icon Header */}
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary-500 rounded-full blur-xl opacity-20 animate-pulse" />
            <div className="relative size-24 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-xl">
              <Zap className="size-12 fill-white" />
            </div>
            <div className="absolute -top-2 -right-2 size-8 rounded-full bg-accent-spotify flex items-center justify-center text-neutral-900 border-4 border-neutral-50">
              <CheckCircle2 className="size-5" />
            </div>
          </div>

          <h1 className="font-display text-4xl font-black tracking-tight text-neutral-900 mb-2">
            Welcome to <span className="text-primary-500">Pro</span>
          </h1>
          <p className="text-lg text-neutral-500 font-medium">
            Your Empatify experience is now fully unlocked.
          </p>
        </div>

        {/* Feature List (Quick Recap) */}
        <div className="bg-white/60 backdrop-blur-sm border border-neutral-200 rounded-2xl p-6 shadow-sm text-left space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <Music2 className="size-4 text-primary-500" />
            </div>
            <span className="text-sm font-semibold text-neutral-700">Unlimited players per lobby</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <Star className="size-4 text-primary-500" />
            </div>
            <span className="text-sm font-semibold text-neutral-700">All categories & game modes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <Zap className="size-4 text-primary-500" />
            </div>
            <span className="text-sm font-semibold text-neutral-700">Full history & AI Mood Cards</span>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full h-12 px-8 rounded-full bg-neutral-900 text-white font-bold hover:bg-neutral-800 transform hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Back to Dashboard
          </Link>
          <p className="mt-4 text-xs text-neutral-400">
            A confirmation email has been sent to your inbox.
          </p>
        </div>
      </div>
    </div>
  );
}
