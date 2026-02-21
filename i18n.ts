import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'de', 'pt', 'fr', 'es'];
export const defaultLocale = 'en';
export const localePrefix = 'always'; // Options: 'always' | 'as-needed' | 'never'

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const resolvedLocale =
    locale != null && locales.includes(locale as (typeof locales)[number])
      ? (locale as (typeof locales)[number])
      : defaultLocale;

  if (locale != null && !locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  return {
    locale: resolvedLocale,
    messages: (await import(`./src/messages/${resolvedLocale}.json`)).default,
  };
});
