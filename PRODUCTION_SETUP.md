# Production Setup for https://empatify.com/auth/callback

## Current Status

✅ **Callback route exists**: `src/app/auth/callback/route.ts`  
✅ **Production URL detection**: Uses `url.origin` in production  
✅ **Error handling**: Properly handles OAuth errors and redirects

## Required Configuration Steps

### 1. Supabase Dashboard Configuration

Go to **Supabase Dashboard → Authentication → URL Configuration**:

#### Site URL
Set to:
```
https://empatify.com
```

#### Redirect URLs
Add these URLs:
```
https://empatify.com/auth/callback
https://empatify.com/redirect
http://localhost:3000/auth/callback
http://192.168.178.180:3000/auth/callback
```

**Important**: The production URL (`https://empatify.com/auth/callback`) MUST be in this list for OAuth to work.

### 2. Google Cloud Console Configuration

Go to **Google Cloud Console → APIs & Services → Credentials**:

#### Authorized redirect URIs
Ensure you have:
```
https://tbszkkguvrzigzvzjcip.supabase.co/auth/v1/callback
```

This is the Supabase callback URL (not your app URL). Google redirects to Supabase, then Supabase redirects to your app.

### 3. Environment Variables

Set in your production environment (Vercel/Netlify/etc.):

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://tbszkkguvrzigzvzjcip.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Note**: Do NOT set `NEXT_PUBLIC_APP_URL` in production - the code uses `window.location.origin` automatically.

### 4. Verify Route Accessibility

The route `/auth/callback` is automatically available at:
- ✅ `https://empatify.com/auth/callback` (production)
- ✅ `http://localhost:3000/auth/callback` (development)
- ✅ `http://192.168.178.180:3000/auth/callback` (dev network)

## How It Works

1. **User clicks "Login with Google"**
   - App calls: `supabase.auth.signInWithOAuth({ provider: "google" })`
   - Redirect URL sent: `https://empatify.com/auth/callback?next=/dashboard`

2. **Supabase redirects to Google**
   - Google shows consent screen

3. **Google redirects to Supabase**
   - URL: `https://tbszkkguvrzigzvzjcip.supabase.co/auth/v1/callback?code=...`
   - Supabase exchanges code for tokens

4. **Supabase redirects to your app**
   - URL: `https://empatify.com/auth/callback?code=...&next=/dashboard`
   - Your route handler processes the code

5. **Your app exchanges code for session**
   - Calls: `supabase.auth.exchangeCodeForSession(code)`
   - Creates user session

6. **Redirect to dashboard**
   - User is redirected to `/dashboard` (or the `next` parameter)

## Testing Checklist

- [ ] Supabase Site URL set to `https://empatify.com`
- [ ] Supabase Redirect URLs include `https://empatify.com/auth/callback`
- [ ] Google OAuth enabled in Supabase
- [ ] Google Client ID/Secret configured in Supabase
- [ ] Google Console has Supabase callback URL
- [ ] Environment variables set in production
- [ ] Test OAuth flow end-to-end

## Troubleshooting

### Issue: "redirect_uri_mismatch"
**Cause**: Redirect URL not in Supabase Redirect URLs list  
**Fix**: Add `https://empatify.com/auth/callback` to Supabase Redirect URLs

### Issue: "code_exchange_failed"
**Cause**: Site URL mismatch or code verifier issue  
**Fix**: Ensure Site URL is `https://empatify.com` and matches production domain

### Issue: Route returns 404
**Cause**: Route not deployed or Next.js routing issue  
**Fix**: Verify `src/app/auth/callback/route.ts` exists and is deployed

### Issue: Redirects to wrong URL
**Cause**: `getBaseUrl()` returning wrong value  
**Fix**: In production, it uses `url.origin` which should be correct. Check Host header.

## Code Verification

The callback route (`src/app/auth/callback/route.ts`) already:
- ✅ Handles OAuth codes
- ✅ Handles errors
- ✅ Exchanges code for session
- ✅ Redirects to correct locale-aware routes
- ✅ Uses `getBaseUrl()` which works correctly in production

No code changes needed - only configuration!
