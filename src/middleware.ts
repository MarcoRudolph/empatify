import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, localePrefix } from '../i18n';

export default createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

