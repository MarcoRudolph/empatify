---
description: "Step-by-step checklist to configure Empatify branding on the Google OAuth consent screen"
paths:
  - "./superpowers/specs/"
---

# Google OAuth Consent Screen — Branding Checklist

## What you can customize

Google lets you configure the following on the OAuth consent screen (what users see when they click "Continue with Google"):

| Field | Impact |
|---|---|
| **App name** | Shown as "Empatify wants access to your Google Account" |
| **App logo** | Shown next to the app name (120×120 PNG, must be verified) |
| **Support email** | Shown to users for help requests |
| **Homepage URL** | Shown as a link — must be on a verified domain |
| **Privacy Policy URL** | Required for production — shown as a link |
| **Terms of Service URL** | Optional — shown as a link |
| **Authorized domains** | Domains your app runs on |

> **What you cannot change:** The Google-hosted sign-in UI itself (accounts.google.com). Google fully controls that layout, font, and color scheme.

---

## Steps

### 1. Open Google Cloud Console
Go to: **console.cloud.google.com → APIs & Services → OAuth consent screen**

### 2. Set App name
- Field: **App name**
- Value: `Empatify`

### 3. Set Support email
- Field: **User support email**
- Value: your support email (e.g. `hello@empatify.de`)

### 4. Upload App logo
- Field: **App logo**
- Requirements: 120×120 px, PNG, under 1 MB, square
- Use the FlowerIcon (7-circle sacred geometry) in orange (#FF6B00) on a dark (#0F0F0F) or transparent background
- Export from the SVG in `src/components/ui/Navbar.tsx` at 120×120 px
- **Note:** Logo changes require verification review — can take days to weeks for production apps

### 5. Set Homepage URL
- Field: **Application home page**
- Value: `https://empatify.de`
- Must be live and accessible before submitting for verification

### 6. Set Privacy Policy URL
- Field: **Application privacy policy link**
- Value: `https://www.empatify.de/privacy`
- `/privacy` redirects to `/[locale]/datenschutz` via `src/app/[locale]/privacy/page.tsx`

### 7. Terms of Service URL
- Field: **Application terms of service link**
- **Leave blank** — this field is optional and an Impressum is not a substitute for TOS. Add a proper TOS page when you have paying users.

### 8. Add Authorized domain
- Field: **Authorized domains**
- Add: `empatify.de`

### 9. Set Developer contact email
- Field: **Developer contact information**
- Value: your developer email

### 10. Save and submit for verification
- Click **Save and continue**
- For production (external users): submit the app for Google verification
- Until verified, only test users (added manually) can sign in with Google

---

## Supabase Site URL (do in dashboard)

Update the Site URL from the current local value to the production domain:

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL** to: `https://empatify.de`
3. Add to **Redirect URLs**: `https://empatify.de/**`

This removes the Supabase project URL from being visible in the OAuth redirect flow.

---

## Supabase Custom Domain (optional, advanced)

If you want `auth.empatify.de` instead of `tbszkkguvrzigzvzjcip.supabase.co` in the OAuth callback URL:

1. Add a CNAME record in your DNS: `auth.empatify.de → tbszkkguvrzigzvzjcip.supabase.co`
2. Run: `supabase domains create --project-ref tbszkkguvrzigzvzjcip --custom-hostname auth.empatify.de`
3. Run: `supabase domains reverify --project-ref tbszkkguvrzigzvzjcip`
4. **Before activating:** Update Google Cloud Console → Authorized redirect URIs to use `auth.empatify.de`
5. Run: `supabase domains activate --project-ref tbszkkguvrzigzvzjcip`

> **Risk:** If you activate before updating Google's redirect URIs, Google sign-in will break. Do steps 1–4 first, then activate.
