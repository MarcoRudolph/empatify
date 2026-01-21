import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

/**
 * Footer component with business information and legal links
 * Displays company info, service links, and legal pages
 */
export const Footer: React.FC<{ locale: string }> = async ({ locale }) => {
  const t = await getTranslations('footer');

  return (
    <footer className="bg-neutral-100 border-t border-neutral-300">
      <div className="max-w-5xl mx-auto px-md py-3xl">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-3xl md:gap-2xl mb-2xl">
          {/* Business Info */}
          <div className="space-y-lg text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              {t('businessName')}
            </h3>
            <p className="text-base md:text-lg text-neutral-600 font-medium leading-relaxed">
              {t('description')}
            </p>
            <p className="text-sm text-neutral-500 mt-xl">
              {t('developedBy')}{' '}
              <a
                href="https://rudolpho-ai.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:text-primary-600 transition-colors font-medium"
              >
                rudolpho-ai.de
              </a>
            </p>
          </div>

          {/* Service Links */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold text-neutral-900 mb-md">
              {t('service.title')}
            </h4>
            <ul className="space-y-xs">
              <li>
                <Link
                  href="/pricing"
                  className="text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  {t('service.pricing')}
                </Link>
              </li>
              <li>
                <Link
                  href="/pro-features"
                  className="text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  {t('service.proFeatures')}
                </Link>
              </li>
              <li>
                <Link
                  href="/documentation"
                  className="text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  {t('service.documentation')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold text-neutral-900 mb-md">
              {t('legal.title')}
            </h4>
            <ul className="space-y-xs">
              <li>
                <Link
                  href="/impressum"
                  className="text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  {t('legal.imprint')}
                </Link>
              </li>
              <li>
                <Link
                  href="/datenschutz"
                  className="text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  {t('legal.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-2xl border-t border-neutral-300">
          <p className="text-sm text-neutral-500 text-center">
            {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

