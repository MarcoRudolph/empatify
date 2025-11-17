import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import Footer from '@/components/ui/Footer';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { MagicCard } from '@/components/ui/magic-card';
import { DotPattern } from '@/components/ui/dot-pattern';

/**
 * Landing page component with Spotify-themed design
 * Features hero section, About, and How-To sections
 */
export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('landing');
  const tCommon = await getTranslations('common');

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image - Placeholder for external image */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-[#1DB954] via-[#191414] to-[#0D0D0D] opacity-90"
          style={{
            backgroundImage: 'url(/img/landingpage_background_4K.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-50/95 via-neutral-50/80 to-transparent" />
        </div>

        {/* Dot Pattern Background */}
        <DotPattern
          className="opacity-20"
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
        />

        {/* Hero Content */}
        <div className="relative z-10 max-w-container mx-auto px-md text-center py-3xl md:py-[100px]">
          <h1 className="text-5xl md:text-6xl font-bold mb-3xl tracking-tight">
            <AnimatedGradientText
              speed={1.5}
              colorFrom="#1DB954"
              colorTo="#FF6B00"
              className="text-5xl md:text-6xl"
            >
              {t('title')}
            </AnimatedGradientText>
          </h1>
          <p className="text-xl md:text-2xl text-neutral-700 mb-3xl max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
          <div className="mt-3xl">
            <Link href="/login" className="inline-block">
              <ShimmerButton
                background="#1DB954"
                shimmerColor="#ffffff"
                borderRadius="9999px"
                className="font-bold text-lg px-8 py-4"
              >
                {tCommon('letsPlay')}
              </ShimmerButton>
            </Link>
          </div>
        </div>

      </section>

      {/* About Section */}
      <section className="py-3xl md:py-[80px] bg-neutral-100 relative overflow-hidden">
        <DotPattern
          className="opacity-10"
          width={16}
          height={16}
          cx={1}
          cy={1}
          cr={1}
        />
        <div className="max-w-container mx-auto px-md relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <MagicCard
              className="p-2xl md:p-3xl rounded-xl"
              gradientFrom="#1DB954"
              gradientTo="#FF6B00"
              gradientSize={300}
            >
              <h2 className="text-4xl font-bold mb-xl text-neutral-900">
                {t('about.title')}
              </h2>
              <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
                {t('about.description')}
              </p>
            </MagicCard>
          </div>
        </div>
      </section>

      {/* How-To Section */}
      <section className="py-3xl md:py-[80px] bg-neutral-50">
        <div className="max-w-container mx-auto px-md">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-3xl md:mb-[80px] text-center text-neutral-900">
              {t('howTo.title')}
            </h2>
            
            <div className="flex flex-col items-center gap-3xl md:gap-[80px]">
              {/* Step 1 */}
              <MagicCard
                className="w-full max-w-md p-xl md:p-2xl rounded-xl"
                gradientFrom="#1DB954"
                gradientTo="#FF6B00"
                gradientSize={250}
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto mb-lg text-white text-3xl font-bold shadow-lg">
                    1
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-sm text-neutral-900">
                    {t('howTo.step1')}
                  </h3>
                </div>
              </MagicCard>

              {/* Connector Arrow */}
              <div className="flex items-center justify-center">
                <div className="h-16 md:h-20 w-0.5 bg-[#1DB954] relative">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-t-8 border-t-[#1DB954] border-l-4 border-l-transparent border-r-4 border-r-transparent" />
                </div>
              </div>

              {/* Step 2 */}
              <MagicCard
                className="w-full max-w-md p-xl md:p-2xl rounded-xl"
                gradientFrom="#1DB954"
                gradientTo="#FF6B00"
                gradientSize={250}
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto mb-lg text-white text-3xl font-bold shadow-lg">
                    2
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-sm text-neutral-900">
                    {t('howTo.step2')}
                  </h3>
                </div>
              </MagicCard>

              {/* Connector Arrow */}
              <div className="flex items-center justify-center">
                <div className="h-16 md:h-20 w-0.5 bg-[#1DB954] relative">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-t-8 border-t-[#1DB954] border-l-4 border-l-transparent border-r-4 border-r-transparent" />
                </div>
              </div>

              {/* Step 3 */}
              <MagicCard
                className="w-full max-w-md p-xl md:p-2xl rounded-xl"
                gradientFrom="#1DB954"
                gradientTo="#FF6B00"
                gradientSize={250}
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto mb-lg text-white text-3xl font-bold shadow-lg">
                    3
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-sm text-neutral-900">
                    {t('howTo.step3')}
                  </h3>
                </div>
              </MagicCard>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer locale={locale} />
    </div>
  );
}

