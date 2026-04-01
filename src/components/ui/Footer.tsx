import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { locales } from '@/i18n';

/**
 * Footer component with business information and legal links
 * Displays company info, service links, and legal pages
 */
export const Footer: React.FC<{ locale: string }> = async ({ locale }) => {
  const t = await getTranslations('footer');
  const localeLabels: Record<string, string> = {
    en: 'EN',
    de: 'DE',
    pt: 'PT',
    fr: 'FR',
    es: 'ES',
  };

  return (
    <footer className="relative border-t border-neutral-300 bg-neutral-75">
      <div className="max-w-container mx-auto px-6 py-10 md:py-14">
        <div className="rounded-2xl border border-neutral-300/70 bg-neutral-100/90 p-6 shadow-sm backdrop-blur-sm">

          {/* Top row: brand + lang switcher */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
                {t('businessName')}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
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
            <div className="inline-flex items-center gap-0.5 rounded-full border border-neutral-300 bg-neutral-200 p-1 shrink-0">
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
          </div>

          {/* Description */}
          <p className="text-sm text-neutral-600 leading-relaxed mb-6 max-w-xs">
            {t('description')}
          </p>

          {/* Link columns — compact grid */}
          <div className="grid grid-cols-2 gap-6 mb-6 md:flex md:gap-12">
            {/* Service */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2.5">
                {t('service.title')}
              </p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/upgrade"
                    className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors duration-200"
                  >
                    Upgrade
                  </Link>
                </li>
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
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2.5">
                {t('legal.title')}
              </p>
              <ul className="space-y-2">
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

          {/* Copyright */}
          <div className="border-t border-neutral-300/80 pt-4">
            <p className="text-center text-xs text-neutral-400">{t('copyright')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

