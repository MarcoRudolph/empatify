# Empatify Setup Progress

## ✅ Completed

### 1. Database Schema (Drizzle ORM)
- ✅ Created `src/lib/db/schema.sql` - Single source of truth for database structure
- ✅ Created `src/lib/db/schema.ts` - Drizzle ORM schema with all tables:
  - users
  - lobbies
  - lobby_participants
  - songs
  - ratings
  - messages
  - friends
- ✅ Created `src/lib/db/index.ts` - Database connection
- ✅ Created `drizzle.config.ts` - Drizzle configuration
- ✅ Added database scripts to package.json

### 2. Internationalization (i18n)
- ✅ Set up next-intl with routing configuration
- ✅ Created translation files for 5 languages:
  - `src/messages/en.json`
  - `src/messages/de.json`
  - `src/messages/pt.json`
  - `src/messages/fr.json`
  - `src/messages/es.json`
- ✅ Configured middleware for locale routing
- ✅ Set up `[locale]` folder structure in app router

### 3. Landing Page
- ✅ Created Spotify-themed landing page with:
  - Hero section with background image support
  - About section
  - How-To section with step visualization
  - Footer links (Privacy, Imprint, Terms, Terms of Use)
  - "Let's Play" CTA button linking to login
- ✅ Fully internationalized with translation keys

### 4. Infrastructure Setup
- ✅ Supabase client configuration (browser & server)
- ✅ Supabase middleware setup
- ✅ Spotify Web API client
- ✅ Stripe client configuration
- ✅ Stripe subscription integration (Checkout & Webhooks)
- ✅ Environment variable template (.env.example)

## 🚧 In Progress / Next Steps

### 2. Authentication (In Progress)
- ⏳ Supabase Auth configuration
- ⏳ Google OAuth setup
- ⏳ Magic Link implementation
- ⏳ Login pages
- ⏳ User profile management (name, avatar)

### 5. Navigation & Layout
- ⏳ Navbar component with logo
- ⏳ User dropdown menu
- ⏳ Protected route handling

### 6. Dashboard
- ⏳ Lobby overview
- ⏳ User search
- ⏳ Friends list
- ⏳ Spotify linking
- ⏳ Mini statistics (Pro)

### 7. Lobby System
- ⏳ Lobby creation form
- ⏳ Category selection (Pro feature)
- ⏳ Round configuration (Pro feature)
- ⏳ User invitation system

### 8. Game Screen
- ⏳ Round progress indicator
- ⏳ Song suggestion interface
- ⏳ Ratings table
- ⏳ Spotify playback integration

### 9. Additional Features
- ⏳ Message/Chat system
- ⏳ Friends system
- ⏳ Statistics page (Pro)
- ⏳ Stripe subscription integration

## 📝 Notes

- Database schema uses PostgreSQL with UUID primary keys
- All text content is internationalized - no hardcoded strings
- Design tokens are used throughout (no arbitrary values)
- Spotify green (#1DB954) used for primary CTA and accents
- Background image path: `/img/landingpage_background_4K.png`

## 🔧 Environment Variables Needed

Create a `.env` file with:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` - Spotify app client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify app secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

## 🚀 Next Commands to Run

1. Set up environment variables in `.env`
2. Run database migrations: `npm run db:push` or `npm run db:migrate`
3. Start development server: `npm run dev`
4. Visit `http://localhost:3000` (will redirect to `/en`)

