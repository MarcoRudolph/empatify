import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale, localePrefix } from '@/i18n';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

export async function middleware(request: NextRequest) {
  // First run the intl middleware to get the localized response
  const intlResponse = intlMiddleware(request);
  
  // Then update the session (refreshes token if needed)
  // and pass the intlResponse to it so it can append cookies to it
  return await updateSession(request, intlResponse);
}

/** Exclude _next, API, Vercel internals, and static files so they are not rewritten with locale. */
export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};
