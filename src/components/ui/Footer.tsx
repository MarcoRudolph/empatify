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
      <div className="max-w-container mx-auto px-md py-2xl md:py-3xl">
        <div className="rounded-2xl border border-neutral-300/70 bg-neutral-100/90 p-6 shadow-sm backdrop-blur-sm md:p-8">
          <div className="mb-6 flex items-center justify-end md:mb-8">
            <div className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-neutral-200 p-1">
              {locales.map((lang) => {
                const isActive = locale === lang;

                return (
                  <a
                    key={lang}
                    href={`/${lang}`}
                    className={`min-w-9 rounded-full px-2.5 py-1 text-center text-xs font-semibold tracking-tight transition-colors duration-200 ${
                      isActive
                        ? 'bg-accent-spotify text-neutral-900'
                        : 'text-neutral-700 hover:bg-neutral-300 hover:text-neutral-900'
                    }`}
                    aria-label={`Switch language to ${lang.toUpperCase()}`}
                  >
                    {localeLabels[lang] ?? lang.toUpperCase()}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="grid gap-8 md:grid-cols-12 md:gap-10">
            {/* Business Info */}
            <div className="space-y-4 text-center md:col-span-5 md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                {t('businessName')}
              </h3>
              <p className="max-w-[36ch] mx-auto text-base md:text-lg text-neutral-700 leading-relaxed md:mx-0">
                {t('description')}
              </p>
              <p className="text-sm text-neutral-500">
                {t('developedBy')}{' '}
                <a
                  href="https://rudolpho-ai.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary-500 transition-colors duration-200 hover:text-primary-600"
                >
                  rudolpho-ai.de
                </a>
              </p>
            </div>

            {/* Navigation Columns */}
            <div className="grid grid-cols-1 gap-8 text-center md:col-span-7 md:grid-cols-2 md:gap-10 md:text-left">
              {/* Service Links */}
              <div>
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-tight text-neutral-500">
                  {t('service.title')}
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/pricing"
                      className="inline-block text-neutral-700 transition-colors duration-200 hover:text-neutral-900"
                    >
                      {t('service.pricing')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/pro-features"
                      className="inline-block text-neutral-700 transition-colors duration-200 hover:text-neutral-900"
                    >
                      {t('service.proFeatures')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/documentation"
                      className="inline-block text-neutral-700 transition-colors duration-200 hover:text-neutral-900"
                    >
                      {t('service.documentation')}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal Links */}
              <div>
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-tight text-neutral-500">
                  {t('legal.title')}
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/impressum"
                      className="inline-block text-neutral-700 transition-colors duration-200 hover:text-neutral-900"
                    >
                      {t('legal.imprint')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/datenschutz"
                      className="inline-block text-neutral-700 transition-colors duration-200 hover:text-neutral-900"
                    >
                      {t('legal.privacy')}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 border-t border-neutral-300/80 pt-5">
            <p className="text-center text-sm text-neutral-500">{t('copyright')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

