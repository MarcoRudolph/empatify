import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

// Create intl middleware with locale detection from Accept-Language header
const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: true, // Enable automatic locale detection
  localePrefix: 'always', // Always add locale prefix for consistency
});

/**
 * Detects the best locale from Accept-Language header
 * Maps browser language to our supported locales
 */
function detectLocaleFromHeader(acceptLanguage: string | null): string {
  if (!acceptLanguage) return 'en'; // Default fallback

  // Supported locales
  const supportedLocales = ['de', 'en', 'pt', 'fr', 'es'];
  
  // Parse Accept-Language header (format: "en-US,en;q=0.9,de;q=0.8")
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, q = 'q=1'] = lang.trim().split(';');
      const quality = parseFloat(q.replace('q=', ''));
      return { locale: locale.toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first matching supported locale
  for (const { locale } of languages) {
    // Check exact match (e.g., "de" or "en")
    if (supportedLocales.includes(locale)) {
      return locale;
    }
    
    // Check language prefix (e.g., "de-DE" -> "de", "en-US" -> "en")
    const langPrefix = locale.split('-')[0];
    if (supportedLocales.includes(langPrefix)) {
      return langPrefix;
    }
    
    // Special cases for Portuguese and Spanish variants
    if (locale.startsWith('pt')) return 'pt'; // pt-BR, pt-PT -> pt
    if (locale.startsWith('es')) return 'es'; // es-ES, es-MX -> es
  }

  return 'en'; // Default fallback
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip i18n middleware for routes that don't need locale prefix:
  // - /lobby/* (lobby routes)
  // - /redirect (QR code redirect route)
  // - /auth/* (auth callback routes - OAuth needs to preserve PKCE code verifier)
  // - /api/* (API routes)
  if (
    pathname.startsWith('/lobby/') || 
    pathname.startsWith('/redirect') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  // Check if locale cookie is already set
  const localeCookie = request.cookies.get('NEXT_LOCALE');
  
  // If no locale cookie and visiting root path, detect and redirect
  if (!localeCookie && pathname === '/') {
    const acceptLanguage = request.headers.get('accept-language');
    const detectedLocale = detectLocaleFromHeader(acceptLanguage);
    
    // Create response with redirect to detected locale
    const response = NextResponse.redirect(
      new URL(`/${detectedLocale}${pathname}`, request.url)
    );
    
    // Set the locale cookie for future visits
    response.cookies.set('NEXT_LOCALE', detectedLocale, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
    });
    
    return response;
  }

  // Handle i18n routing for other paths
  const response = intlMiddleware(request);

  return response;
}

export const config = {
  // Match internationalized pathnames, lobby routes, redirect route, and auth routes
  // IMPORTANT: Include /login explicitly to ensure it gets locale-redirected
  matcher: [
    '/', 
    '/login',
    '/dashboard',
    '/settings',
    '/messages/:path*',
    '/(de|en|pt|fr|es)/:path*', 
    '/lobby/:path*', 
    '/redirect',
    '/auth/:path*',
    '/api/:path*'
  ],
};

