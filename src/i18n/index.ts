/**
 * Re-export i18n config from root so @/i18n resolves consistently in app and API routes.
 * Root i18n.ts remains the source of truth for next-intl plugin (see next.config).
 */
export { locales, defaultLocale, localePrefix } from '../../i18n';
