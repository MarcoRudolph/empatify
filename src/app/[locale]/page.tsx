import { getTranslations } from 'next-intl/server';
import Footer from '@/components/ui/Footer';
import { Users, Music2, Trophy } from 'lucide-react';
import OAuthCallbackHandler from './OAuthCallbackHandler';
import { HeroLoginCard } from './HeroLoginCard';

/** Flower-of-life derived icon — 7 overlapping circles, stroke only */
function FlowerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="3 2 34 36"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      {/* center */}
      <circle cx="20" cy="20" r="9" strokeOpacity="0.9" />
      {/* top */}
      <circle cx="20" cy="11" r="9" strokeOpacity="0.65" />
      {/* top-right */}
      <circle cx="27.8" cy="15.5" r="9" strokeOpacity="0.65" />
      {/* bottom-right */}
      <circle cx="27.8" cy="24.5" r="9" strokeOpacity="0.65" />
      {/* bottom */}
      <circle cx="20" cy="29" r="9" strokeOpacity="0.65" />
      {/* bottom-left */}
      <circle cx="12.2" cy="24.5" r="9" strokeOpacity="0.65" />
      {/* top-left */}
      <circle cx="12.2" cy="15.5" r="9" strokeOpacity="0.65" />
    </svg>
  );
}

/** Five star rating display */
function FiveStars() {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="size-3.5 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
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
  const tLobby = await getTranslations('lobby');

  const steps = [
    { num: '01', icon: Users,  text: t('howTo.step1') },
    { num: '02', icon: Music2, text: t('howTo.step2') },
    { num: '03', icon: Trophy, text: t('howTo.step3') },
  ];

  const bullets = [
    { emoji: '🎵', text: 'Listen to music → rate songs of your friends' },
    { emoji: '✨', text: 'Getting new music inspiration' },
    { emoji: '🤝', text: 'Bond with your friends' },
    { emoji: '🧠', text: 'Choose songs wisely with empathy' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* Background layers */}
        <div className="hero-scroll-out absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/img/landingpage_background_4K.png)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-50/95 via-neutral-50/85 to-neutral-50/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-50 via-transparent to-neutral-50/70" />
        </div>

        {/* Glow orbs */}
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] rounded-full bg-primary-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent-spotify/10 blur-[100px] pointer-events-none" />

        {/* ── Top bar: brand only ───────────────────────────────────── */}
        <div className="relative z-20 px-6 md:px-10 pt-6 md:pt-8">
          <div className="flex items-center gap-2.5">
            <div className="spin-slow text-primary-500 size-7 shrink-0">
              <FlowerIcon className="size-7" />
            </div>
            <span className="font-display text-xl font-black tracking-tight text-neutral-900">
              empatify
            </span>
          </div>
        </div>

        {/* ── Hero content ─────────────────────────────────────────── */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="max-w-7xl mx-auto px-6 md:px-10 w-full py-12 md:py-20">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">

              {/* Left: copy */}
              <div className="flex-1 max-w-xl">

                {/* Heroic badge */}
                <div className="anim-fade-up anim-d1 inline-flex flex-col items-start gap-1.5 mb-8">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-black text-white shadow-lg">
                    <span className="text-xs font-bold tracking-widest uppercase">#1 Game with Spotify</span>
                  </div>
                  <div className="pl-1">
                    <FiveStars />
                  </div>
                </div>

                {/* Headline */}
                <h1 className="anim-fade-up anim-d2 font-display text-[clamp(3rem,7.5vw,6.5rem)] font-black leading-[0.92] tracking-tight mb-8">
                  Gamify <span className="block">hanging</span>
                  <span className="block">out<span className="text-primary-500">!</span></span>
                </h1>

                {/* Bullet list */}
                <ul className="anim-fade-up anim-d3 space-y-3 mb-10">
                  {bullets.map(({ emoji, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <span className="text-lg leading-none mt-0.5 shrink-0">{emoji}</span>
                      <span className="text-base md:text-lg text-neutral-500 font-medium leading-snug">{text}</span>
                    </li>
                  ))}
                </ul>

                {/* Login card on mobile (below bullets) */}
                <div className="anim-fade-up anim-d4 lg:hidden">
                  <HeroLoginCard />
                </div>
              </div>

              {/* Right: login card — desktop */}
              <div className="anim-fade-up anim-d4 hidden lg:block shrink-0 w-full max-w-[380px]">
                <HeroLoginCard />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 pb-8 flex flex-col items-center gap-2 text-neutral-400 anim-fade-up anim-d5">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-neutral-400 to-transparent" />
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section className="py-28 md:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 via-neutral-75 to-neutral-50 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 max-w-[3rem] bg-neutral-300" />
            <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
              {t('howTo.title')}
            </span>
          </div>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-20 max-w-2xl">
            Three steps to{' '}
            <span className="text-primary-500">win</span>.
          </h2>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8 lg:gap-16">
            {steps.map(({ num, icon: Icon, text }, i) => (
              <div key={num} className="group relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-neutral-300 -z-10 translate-x-4" style={{ width: 'calc(100% - 2rem)' }} />
                )}
                <div className="font-display text-7xl md:text-8xl font-black text-neutral-200 leading-none mb-6 group-hover:text-primary-500/20 transition-colors duration-500 select-none">
                  {num}
                </div>
                <div className="inline-flex items-center justify-center size-11 rounded-xl bg-primary-500/10 border border-primary-500/20 mb-5 group-hover:bg-primary-500/20 transition-colors duration-300">
                  <Icon className="size-5 text-primary-500" />
                </div>
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
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-500/8 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 md:px-10 text-center">
          <div className="font-display text-8xl font-black text-neutral-300 leading-none mb-4 select-none">"</div>
          <p className="text-2xl md:text-3xl lg:text-4xl font-medium text-neutral-700 leading-relaxed mb-12">
            {t('about.description')}
          </p>

          {/* Subtle brand repeat — no duplicate CTA button */}
          <div className="flex items-center justify-center gap-3 text-neutral-400">
            <div className="spin-slow text-primary-500/60 size-6">
              <FlowerIcon className="size-6" />
            </div>
            <span className="font-display text-sm font-black tracking-widest uppercase text-neutral-400">
              empatify
            </span>
            <div className="spin-slow text-primary-500/60 size-6" style={{ animationDirection: 'reverse' }}>
              <FlowerIcon className="size-6" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <Footer locale={locale} />
    </div>
  );
}
