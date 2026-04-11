---
description: "Claude onboarding for the Empatify repo — architecture, conventions, and how to find prior context in OpenBrain"
paths:
  - "./IMPLEMENTATIONPLAN.md"
  - "./FEATURE.md"
  - "./src/lib/db/schema.ts"
---

# Claude Instructions — Empatify

## What is Empatify?

Empatify is a **multiplayer music taste game** built on Spotify. The core thesis: *"Do you know your friends well enough?"*

**Core loop:**
1. A host creates a lobby (optionally with a music category and round prompts)
2. Players join — each round, every player picks a Spotify song
3. All players rate each other's songs (1–10)
4. Highest average rating wins
5. Post-game: leaderboard, mood card, playlist export

**The name** = Empathy + Spotify. You pick songs your friends will love, not just your favourites. Empathy is the skill being tested.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database ORM | Drizzle ORM |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Magic Link + Google OAuth) |
| Music API | Spotify Web API (Client Credentials + user OAuth) |
| AI validation | OpenAI gpt-4o-mini |
| Styling | Tailwind CSS |
| i18n | next-intl (de, en, pt, fr, es) |
| Deployment | Vercel |

---

## Key files

| File | Purpose |
|---|---|
| `src/lib/db/schema.ts` | Full Drizzle schema — source of truth for all tables |
| `src/app/[locale]/dashboard/page.tsx` | Main dashboard — lobby list, stats, friend list |
| `src/app/[locale]/dashboard/CreateGameSection.tsx` | Game creation card (rounds, category, prompts, blind mode) |
| `src/app/[locale]/dashboard/LobbyList.tsx` | Lobby cards with status, tooltip, leaderboard |
| `src/app/lobby/[id]/LobbyPageClient.tsx` | In-game lobby view |
| `src/app/lobby/[id]/select-song/SelectSongPageClient.tsx` | Spotify song search + submission |
| `src/app/api/lobby/[id]/song/route.ts` | Song submission API — AI category validation lives here |
| `src/app/api/ai/validate-song-category/route.ts` | OpenAI category gate (gpt-4o-mini, ~12 tokens/call) |
| `src/lib/plan/checkCategoryAccess.ts` | Pro trial eligibility check (4 weeks OR <$1 tokens) |
| `src/components/ui/Navbar.tsx` | Authenticated navbar — FlowerIcon + "empatify" wordmark |
| `src/components/ui/Footer.tsx` | Landing footer — centered layout, Upgrade opens modal |
| `src/components/ui/UpgradeModal.tsx` | Free vs Pro plan comparison modal |
| `src/messages/en.json` | English translations (reference for adding new keys) |
| `IMPLEMENTATIONPLAN.md` | Full feature roadmap with task-by-task implementation steps |
| `FEATURE.md` | Detailed specs: Round Prompts, Blind Mode, Post-Game Mood Card |

---

## Pro Plan vs Free Plan

See `IMPLEMENTATIONPLAN.md` for the full table. Short version:

- **Free:** messaging + friends ✓, max 3 players/lobby, rounds 1–10, category games on 4-week trial (capped at ~$1 AI cost), last 3 game history, no stats
- **Pro:** unlimited players, full category + AI features always-on, Round Prompts, Blind Mode, Guess the Submitter, Post-Game Mood Card, full Spotify playlist export, full game history + Top 5 songs stat

Trial tracking: `users.ai_trial_started_at` + `users.ai_tokens_used`. Gate is in `src/lib/plan/checkCategoryAccess.ts`.

---

## Finding prior context in OpenBrain

**OpenBrain** is the shared vector memory (Supabase project: `vdlucgmzmdjlnzomwfqa`). All Claude sessions store learnings, decisions, and progress there.

### How to use Open Brain MCP

The `open-brain` MCP is registered at user scope. Tools: `capture_thought`, `search_thoughts`, `list_thoughts`, `thought_stats`.

If MCP tools are not available in the deferred tools list (check session), call via curl:

```bash
# Search thoughts
curl -s -X POST "https://vdlucgmzmdjlnzomwfqa.supabase.co/functions/v1/open-brain-mcp" \
  -H "x-brain-key: 0c3d14b2d3e3cfe5a57610972c4f8e3d035f8901ff5fe38c8bd152225134f1aa" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","id":1,"params":{"name":"search_thoughts","arguments":{"query":"empatify pro plan"}}}'

# Capture thought
curl -s -X POST "https://vdlucgmzmdjlnzomwfqa.supabase.co/functions/v1/open-brain-mcp" \
  -H "x-brain-key: 0c3d14b2d3e3cfe5a57610972c4f8e3d035f8901ff5fe38c8bd152225134f1aa" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","id":2,"params":{"name":"capture_thought","arguments":{"content":"[empatify] your learning here. metadata.domain: [project:empatify, ...]"}}}'
```

### What is stored in OpenBrain for Empatify

As of 2026-04-06, the following context has been documented:

- **Game core loop** — how lobbies, songs, ratings, and the leaderboard work
- **Pro vs Free plan definition** — full feature table, trial logic ($1 budget / 4 weeks)
- **AI category validation** — prompt optimisation (12 tokens vs 125 tokens, English yes/no)
- **Feature specs** — Round Prompts, Blind Mode, Post-Game Mood Card, Playlist Export, Game History, Top 5 stat
- **Dashboard upsert fix** — atomic `onConflictDoUpdate` to prevent duplicate key on parallel logins
- **Playwright test setup** — port 3001, global-setup storageState auth, webServer.env override for NEXT_PUBLIC_APP_URL

---

## Conventions

- **Translations:** Add new keys to all 5 locale files (`de`, `en`, `pt`, `fr`, `es`). Reference key from nearest namespace in `en.json`.
- **Client vs Server components:** Dashboard page is a Server Component that fetches data. Interactive child components (dropdowns, modals) are `"use client"`.
- **Footer:** Server component. For interactive elements (Upgrade modal), use `FooterUpgradeButton` client wrapper.
- **Brand mark:** FlowerIcon SVG (7 circles) + `.spin-slow` CSS class + "empatify" in Unbounded weight-900. See `DESIGN.md` in global Claude rules.
- **API errors:** Always return `{ error: { code, message, status } }` — consistent shape across all routes.
- **Category validation:** Always fail open — if AI call fails, allow the song. Never block on AI outage.

---

## ⚠️ Color Contrast — Inverted Neutral Token System (CRITICAL)

This project uses an **inverted neutral scale** in `src/styles/tokens.css`. The `neutral-*` numbers do NOT match Tailwind's default light→dark direction. They are flipped:

| Token | Hex | Visual |
|---|---|---|
| `--color-neutral-50`  | `#0F0F0F` | near-black (page bg) |
| `--color-neutral-75`  | `#141414` | |
| `--color-neutral-100` | `#1A1A1A` | dark surface (cards) |
| `--color-neutral-200` | `#222222` | |
| `--color-neutral-300` | `#2B2B2B` | borders |
| `--color-neutral-400` | `#6B6B6B` | muted icons |
| `--color-neutral-500` | `#9A9A9A` | muted text |
| `--color-neutral-700` | `#D1D1D1` | body text on dark |
| `--color-neutral-800` | `#E5E5E5` | |
| `--color-neutral-900` | `#FFFFFF` | **WHITE** — primary text |

**Consequences — read before writing any color class:**

1. **`text-neutral-900` is WHITE**, not near-black. `text-neutral-50` is near-black.
2. **NEVER use `bg-white`** in this repo. It is literal `#FFFFFF` and does not participate in the token system. Paired with `text-neutral-900` it gives **white-on-white**. Use `bg-neutral-100` / `bg-neutral-200` for card surfaces.
3. **NEVER use `text-black`** with a token-based neutral background. You will get black-on-black on dark surfaces.
4. **`text-neutral-600` is undefined** in `tokens.css` and falls back to Tailwind's default `#525252` — nearly invisible on `bg-neutral-100`. Use `text-neutral-700` (`#D1D1D1`) for body text instead.
5. **Before shipping any UI with a background color change**, mentally trace: *what is the hex of this bg, what is the hex of the text on it?* If you can't answer both, look them up in `tokens.css`.

**Contrast sanity checklist** (apply on every new/edited component):
- [ ] Background uses a token (`bg-neutral-*`, `bg-primary-*`, `bg-accent-*`) — not `bg-white` / `bg-black`.
- [ ] Text on dark surfaces: `text-neutral-900` (white) for headings, `text-neutral-700` for body, `text-neutral-500` only for hints/labels.
- [ ] Text on colored surfaces (`bg-primary-500`, etc.): use literal `text-white` — NOT `text-neutral-900` (same result but explicit intent signals it's not a token-surface).
- [ ] Avoid `text-neutral-600` — undefined, low contrast.
- [ ] Disabled/muted text on dark card: `text-neutral-500` minimum, never `text-neutral-400` for readable text.

**When in doubt:** open `src/styles/tokens.css`, look up the hex of both your `bg-*` and `text-*` class, and verify they differ by at least ~80 lightness points.
