import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

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

  // Handle i18n routing for other paths
  const response = intlMiddleware(request);

  // Add Supabase session handling here if needed
  // For now, we'll handle auth in individual route handlers

  return response;
}

export const config = {
  // Match internationalized pathnames, lobby routes, redirect route, and auth routes
  matcher: [
    '/', 
    '/(de|en|pt|fr|es)/:path*', 
    '/lobby/:path*', 
    '/redirect',
    '/auth/:path*',
    '/api/:path*'
  ],
};

