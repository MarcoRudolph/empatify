# Google OAuth Login Fix

## Problem Analysis

Your Google OAuth is configured with:
- **Client ID**: `298646986973-f2i4gvn06ffpj0784htthn5j61thhtg9.apps.googleusercontent.com`
- **Redirect URL**: `https://tbszkkguvrzigzvzjcip.supabase.co/auth/v1/callback`

## How Supabase OAuth Works

1. User clicks "Login with Google" → App calls `supabase.auth.signInWithOAuth({ provider: "google" })`
2. Supabase redirects to Google → Google shows consent screen
3. Google redirects back to → `https://[your-project].supabase.co/auth/v1/callback` (Supabase's callback)
4. Supabase processes OAuth → Exchanges code for tokens
5. Supabase redirects to your app → `/auth/callback?code=...` (Your Next.js callback route)

## Common Issues & Solutions

### Issue 1: Google OAuth Not Configured in Supabase

**Check:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Google" provider
3. Ensure it's **enabled**

**Fix:**
1. Enable Google provider
2. Add your Google **Client ID**: `298646986973-f2i4gvn06ffpj0784htthn5j61thhtg9.apps.googleusercontent.com`
3. Add your Google **Client Secret** (get it from Google Cloud Console)
4. Save

### Issue 2: Redirect URL Mismatch in Google Console

**Current Setup:**
- Your redirect URL: `https://tbszkkguvrzigzvzjcip.supabase.co/auth/v1/callback` ✅ **CORRECT**

**Verify in Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, ensure you have:
   ```
   https://tbszkkguvrzigzvzjcip.supabase.co/auth/v1/callback
   ```
6. If missing, add it and **Save**

### Issue 3: Supabase Site URL Configuration

**Check:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. **Site URL** should match your app's base URL:
   - Production: `https://yourdomain.com`
   - Development: `http://192.168.178.180:3000` (or your dev URL)

**Redirect URLs** should include:
```
http://localhost:3000/auth/callback
http://192.168.178.180:3000/auth/callback
https://yourdomain.com/auth/callback
```

### Issue 4: Google Client Secret Missing

**Get Client Secret:**
1. Go to Google Cloud Console → Credentials
2. Click on your OAuth 2.0 Client ID
3. Copy the **Client Secret**
4. Add it to Supabase Dashboard → Authentication → Providers → Google

### Issue 5: OAuth Consent Screen Not Configured

**Check:**
1. Go to Google Cloud Console → **APIs & Services** → **OAuth consent screen**
2. Ensure:
   - App is in **Testing** or **Production** mode
   - **User support email** is set
   - **Developer contact information** is set
   - **Scopes** are configured (if needed)

## Step-by-Step Fix Checklist

- [ ] **Step 1**: Enable Google provider in Supabase Dashboard
- [ ] **Step 2**: Add Google Client ID to Supabase: `298646986973-f2i4gvn06ffpj0784htthn5j61thhtg9.apps.googleusercontent.com`
- [ ] **Step 3**: Add Google Client Secret to Supabase (get from Google Cloud Console)
- [ ] **Step 4**: Verify redirect URL in Google Console: `https://tbszkkguvrzigzvzjcip.supabase.co/auth/v1/callback`
- [ ] **Step 5**: Configure Supabase Site URL and Redirect URLs
- [ ] **Step 6**: Test OAuth flow

## Testing

After fixing the configuration:

1. Open browser console (F12)
2. Click "Login with Google"
3. Check console logs for:
   - `🟢 Starting OAuth flow:` - Should show redirectTo URL
   - `🔵 Auth Callback Request:` - Should appear after Google redirect
   - `✅ Auth callback successful` - Should appear if successful

## Debugging

If still not working, check:

1. **Browser Console Errors**: Look for any JavaScript errors
2. **Network Tab**: Check the OAuth redirect flow
3. **Supabase Logs**: Go to Supabase Dashboard → Logs → Auth Logs
4. **Google Cloud Console**: Check OAuth consent screen status

## Common Error Messages

### "redirect_uri_mismatch"
- **Cause**: Redirect URL in Google Console doesn't match Supabase callback
- **Fix**: Add `https://tbszkkguvrzigzvzjcip.supabase.co/auth/v1/callback` to Google Console

### "invalid_client"
- **Cause**: Client ID or Secret incorrect in Supabase
- **Fix**: Verify Client ID and Secret in Supabase Dashboard

### "access_denied"
- **Cause**: User denied consent or OAuth consent screen not configured
- **Fix**: Configure OAuth consent screen in Google Cloud Console

### "code_exchange_failed"
- **Cause**: Code verifier mismatch (PKCE issue)
- **Fix**: Ensure Site URL in Supabase matches where the app is running

## Additional Notes

- The redirect URL in Google Console **MUST** be the Supabase callback URL, not your app URL
- Supabase handles the OAuth exchange and then redirects to your app
- Your app's `/auth/callback` route receives the code from Supabase, not directly from Google
