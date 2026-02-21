import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for browser-side operations
 * Configured to properly handle cookies
 * Uses PKCE flow for robust OAuth + session handling
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Keep OAuth and callback handling consistent with client-side code exchange.
        flowType: 'pkce',
        // Auto-refresh tokens
        autoRefreshToken: true,
        // Persist session in cookies
        persistSession: true,
        // Detect session in URL (for callbacks)
        detectSessionInUrl: true,
      },
      cookies: {
        getAll() {
          if (typeof document === 'undefined') {
            return [];
          }

          return document.cookie.split(';').map(cookie => {
            const [name, ...rest] = cookie.split('=')
            return {
              name: name.trim(),
              value: rest.join('=').trim(),
            }
          })
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') {
            return;
          }

          cookiesToSet.forEach(({ name, value, options }) => {
            // Set cookie with proper options
            let cookieString = `${name}=${value}`
            
            if (options?.maxAge) {
              cookieString += `; max-age=${options.maxAge}`
            }
            if (options?.domain) {
              cookieString += `; domain=${options.domain}`
            }
            if (options?.path) {
              cookieString += `; path=${options.path}`
            } else {
              cookieString += `; path=/`
            }
            if (options?.secure) {
              cookieString += `; secure`
            }
            if (options?.sameSite) {
              cookieString += `; samesite=${options.sameSite}`
            }
            
            document.cookie = cookieString
          })
        },
      },
    }
  );
}

