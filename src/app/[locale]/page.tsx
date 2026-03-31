import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import Footer from '@/components/ui/Footer';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { Users, Music2, Trophy } from 'lucide-react';
import OAuthCallbackHandler from './OAuthCallbackHandler';

/** Fake "Now Playing" card — explains the game at a glance */
function NowPlayingCard() {
  return (
    <div className="float-card w-72 xl:w-80">
      {/* Main card */}
      <div className="relative bg-neutral-100 border border-neutral-300 rounded-2xl p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-primary-500" />
          </span>
          <span className="text-[10px] tracking-widest uppercase font-semibold text-neutral-500">Now Playing</span>
        </div>

        {/* Track */}
        <div className="flex items-center gap-3 mb-5">
          <div className="size-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-900 flex items-center justify-center text-xl shrink-0 shadow-lg">
            🎵
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-neutral-900 text-sm truncate">Blinding Lights</div>
            <div className="text-neutral-500 text-xs">The Weeknd</div>
          </div>
          {/* Music bars */}
          <div className="flex items-end gap-0.5 h-5 shrink-0">
            {[40, 100, 65, 85, 45].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-primary-500 rounded-full music-bar"
                style={{ height: `${h}%`, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-300 mb-4" />

        {/* Rating row */}
        <div className="mb-4">
          <div className="text-[10px] tracking-widest uppercase text-neutral-500 mb-2">Rate this song</div>
          <div className="flex gap-1.5">
            {[7, 8, 9, 10].map((n) => (
              <div
                key={n}
                className={`flex-1 py-2 rounded-lg text-center text-xs font-bold transition-colors ${
                  n === 9
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                    : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                {n}
              </div>
            ))}
          </div>
        </div>

        {/* Average */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-neutral-500">Group average</span>
          <span className="text-sm font-bold text-neutral-900">8.4 / 10</span>
        </div>
        <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600" style={{ width: '84%' }} />
        </div>

        {/* Friend ratings */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-300">
          {[
            { initials: 'LM', rating: 9, color: 'bg-accent-spotify' },
            { initials: 'TK', rating: 8, color: 'bg-accent-blue' },
            { initials: 'SR', rating: 8, color: 'bg-primary-500' },
          ].map(({ initials, rating, color }) => (
            <div key={initials} className="flex items-center gap-1.5">
              <div className={`size-6 rounded-full ${color} flex items-center justify-center text-[9px] font-bold text-white`}>
                {initials}
              </div>
              <span className="text-xs font-semibold text-neutral-700">{rating}</span>
            </div>
          ))}
          <span className="ml-auto text-[10px] text-neutral-500">3/4 rated</span>
        </div>
      </div>

      {/* Stack shadow card */}
      <div className="absolute -bottom-2 -right-2 w-full h-full bg-neutral-200 border border-neutral-300/60 rounded-2xl -z-10 rotate-[3deg]" />
    </div>
  );
}

export default async function LandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string; [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  // OAuth callback
  if (resolvedSearchParams.code) {
    const code = Array.isArray(resolvedSearchParams.code)
      ? resolvedSearchParams.code[0]
      : resolvedSearchParams.code;
    const next = Array.isArray(resolvedSearchParams.next)
      ? resolvedSearchParams.next[0]
      : resolvedSearchParams.next;
    return <OAuthCallbackHandler code={code} locale={locale} next={next} />;
  }

  const t = await getTranslations('landing');
  const tCommon = await getTranslations('common');

  const steps = [
    { num: '01', icon: Users,  text: t('howTo.step1') },
    { num: '02', icon: Music2, text: t('howTo.step2') },
    { num: '03', icon: Trophy, text: t('howTo.step3') },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* Background layers */}
        <div className="hero-scroll-out absolute inset-0">
          {/* Photo */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/img/landingpage_background_4K.png)' }}
          />
          {/* Dark vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-50/95 via-neutral-50/80 to-neutral-50/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-50 via-transparent to-neutral-50/60" />
        </div>

        {/* Glow orbs */}
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] rounded-full bg-primary-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-accent-spotify/10 blur-[100px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 w-full py-28 md:py-36">
          <div className="flex items-center justify-between gap-16">

            {/* Left: copy */}
            <div className="flex-1 max-w-2xl">
              {/* Badge */}
              <div className="anim-fade-up anim-d1 inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-neutral-300 bg-neutral-100/50 backdrop-blur-sm mb-8">
                <span className="size-2 rounded-full bg-accent-spotify animate-pulse shrink-0" />
                <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
                  Multiplayer Music Game
                </span>
              </div>

              {/* Headline */}
              <h1 className="anim-fade-up anim-d2 font-display text-[clamp(3.5rem,8vw,7rem)] font-black leading-[0.92] tracking-tight mb-8">
                {t('title')}
                <span className="block text-primary-500">.</span>
              </h1>

              {/* Subtext */}
              <p className="anim-fade-up anim-d3 text-lg md:text-xl text-neutral-500 leading-relaxed max-w-lg mb-12">
                {t('subtitle')}
              </p>

              {/* CTA */}
              <div className="anim-fade-up anim-d4 flex items-center gap-4 flex-wrap">
                <Link href="/login">
                  <ShimmerButton
                    background="var(--color-primary-500)"
                    shimmerColor="var(--color-neutral-900)"
                    borderRadius="9999px"
                    className="font-bold text-base px-8 py-4 tracking-wide"
                  >
                    {tCommon('letsPlay')} →
                  </ShimmerButton>
                </Link>
                <span className="text-sm text-neutral-500">
                  Free · No account needed to join
                </span>
              </div>
            </div>

            {/* Right: mock card — desktop only */}
            <div className="anim-fade-up anim-d5 hidden lg:block shrink-0">
              <NowPlayingCard />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-500 anim-fade-up anim-d5">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-neutral-500 to-transparent" />
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section className="py-28 md:py-36 relative overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 via-neutral-75 to-neutral-50 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          {/* Section label */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 max-w-[3rem] bg-neutral-300" />
            <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
              {t('howTo.title')}
            </span>
          </div>

          {/* Section headline */}
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-20 max-w-2xl">
            Three steps to{' '}
            <span className="text-primary-500">win</span>.
          </h2>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-12 md:gap-8 lg:gap-16">
            {steps.map(({ num, icon: Icon, text }, i) => (
              <div key={num} className="group relative">
                {/* Connector line (between cards) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-neutral-300 -z-10 translate-x-4" style={{ width: 'calc(100% - 2rem)' }} />
                )}

                {/* Number */}
                <div className="font-display text-7xl md:text-8xl font-black text-neutral-200 leading-none mb-6 group-hover:text-primary-500/20 transition-colors duration-500 select-none">
                  {num}
                </div>

                {/* Icon pill */}
                <div className="inline-flex items-center justify-center size-11 rounded-xl bg-primary-500/10 border border-primary-500/20 mb-5 group-hover:bg-primary-500/20 transition-colors duration-300">
                  <Icon className="size-5 text-primary-500" />
                </div>

                {/* Text */}
                <p className="text-neutral-700 leading-relaxed text-base md:text-lg">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / QUOTE ───────────────────────────────────────────── */}
      <section className="py-28 md:py-36 bg-neutral-100 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-500/8 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 md:px-10 text-center">
          {/* Quote mark */}
          <div className="font-display text-8xl font-black text-neutral-300 leading-none mb-4 select-none">"</div>

          {/* Statement */}
          <p className="text-2xl md:text-3xl lg:text-4xl font-medium text-neutral-700 leading-relaxed mb-16">
            {t('about.description')}
          </p>

          {/* Second CTA */}
          <Link href="/login">
            <ShimmerButton
              background="var(--color-primary-500)"
              shimmerColor="var(--color-neutral-900)"
              borderRadius="9999px"
              className="font-bold text-base px-8 py-4 tracking-wide"
            >
              {tCommon('letsPlay')}
            </ShimmerButton>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <Footer locale={locale} />
    </div>
  );
}
