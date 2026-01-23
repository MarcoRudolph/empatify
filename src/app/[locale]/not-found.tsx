'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function NotFoundPage() {
  const t = useTranslations('NotFound');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 text-center p-4">
      <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-neutral-800 mb-2">{t('title')}</h2>
      <p className="text-neutral-600 mb-8">{t('description')}</p>
      <Link href="/" className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors">
          {t('returnHome')}
      </Link>
    </div>
  );
}
