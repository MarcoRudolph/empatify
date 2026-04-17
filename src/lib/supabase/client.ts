import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for browser-side operations.
 *
 * Relies on @supabase/ssr's default document.cookie handling so that
 * cookie attributes (max-age, expires, path, sameSite, secure) set by
 * the library are preserved correctly. Our previous custom cookie writer
 * dropped `expires`, mis-handled `maxAge=0`, and omitted sensible
 * SameSite/Secure defaults — which caused the Google OAuth session to
 * fall back to a browser-session cookie that did not survive a refresh
 * or revisit.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );
}
