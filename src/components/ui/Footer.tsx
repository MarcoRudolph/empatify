import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { locales } from '@/i18n';
import { FooterUpgradeButton } from './FooterUpgradeButton';
import { createClient } from '@/lib/supabase/server';

function FlowerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="2 1 36 38" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
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

export const Footer: React.FC<{ locale: string }> = async ({ locale }) => {
  const t = await getTranslations('footer');
  const localeLabels: Record<string, string> = {
    en: 'EN', de: 'DE', pt: 'PT', fr: 'FR', es: 'ES',
  };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <footer className="relative border-t border-neutral-300 bg-neutral-75">
      <div className="max-w-container mx-auto px-6 py-10 md:py-14">
        <div className="rounded-2xl border border-neutral-300/70 bg-neutral-100/90 p-6 md:p-10 shadow-sm backdrop-blur-sm">

          {/* Brand — centered */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="spin-slow text-primary-500 size-7 shrink-0">
                <FlowerIcon className="size-7" />
              </div>
              <span className="font-display text-xl font-black tracking-tight text-neutral-900">
                empatify
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1.5">
              {t('developedBy')}{' '}
              <a
                href="https://rudolpho-ai.de"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-500 hover:text-primary-600 transition-colors duration-200"
              >
                rudolpho-ai.de
              </a>
            </p>
          </div>

          {/* Link columns — centered */}
          <div className="flex justify-center gap-16 md:gap-24 mb-8">
            {/* Service */}
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
                {t('service.title')}
              </p>
              <ul className="space-y-2.5">
                {isLoggedIn && (
                  <li>
                    <FooterUpgradeButton label="Upgrade" />
                  </li>
                )}
                <li>
                  <Link
                    href="/documentation"
                    className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors duration-200"
                  >
                    {t('service.documentation')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
                {t('legal.title')}
              </p>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/impressum"
                    className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors duration-200"
                  >
                    {t('legal.imprint')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/datenschutz"
                    className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors duration-200"
                  >
                    {t('legal.privacy')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-neutral-300/80 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Language picker */}
            <div className="inline-flex items-center gap-0.5 rounded-full border border-neutral-300 bg-neutral-200 p-1">
              {locales.map((lang) => {
                const isActive = locale === lang;
                return (
                  <a
                    key={lang}
                    href={`/${lang}`}
                    className={`min-w-8 rounded-full px-2 py-1 text-center text-xs font-semibold tracking-tight transition-colors duration-200 ${
                      isActive
                        ? 'bg-accent-spotify text-neutral-900'
                        : 'text-neutral-600 hover:bg-neutral-300 hover:text-neutral-900'
                    }`}
                    aria-label={`Switch language to ${lang.toUpperCase()}`}
                  >
                    {localeLabels[lang] ?? lang.toUpperCase()}
                  </a>
                );
              })}
            </div>

            <p className="text-xs text-neutral-400 text-center">{t('copyright')}</p>

            {/* Spacer to balance the lang picker */}
            <div className="hidden sm:block w-[120px]" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
