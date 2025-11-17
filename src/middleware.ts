import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // Handle i18n routing first
  const response = intlMiddleware(request);

  // Add Supabase session handling here if needed
  // For now, we'll handle auth in individual route handlers

  return response;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|en|pt|fr|es)/:path*'],
};

