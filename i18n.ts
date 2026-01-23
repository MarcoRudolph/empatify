import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'de', 'pt', 'fr', 'es'];
export const defaultLocale = 'en';
export const localePrefix = 'always'; // Options: 'always' | 'as-needed' | 'never'

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
