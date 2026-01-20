import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'de', 'pt', 'fr', 'es'],

  // Used when no locale matches
  defaultLocale: 'en',
  
  // Enable locale detection from Accept-Language header
  localeDetection: true,
  
  // Only add locale prefix when needed (not for default locale on root)
  localePrefix: 'as-needed',
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

