---
description: "Implementation plan for Rudolpho-AI distribution strategy — manual account setup, Empatify SEO pages, Product Hunt prep, influencer outreach templates, email capture"
paths:
  - "../specs/2026-04-03-distribution-strategy-design.md"
---

# Distribution Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the Rudolpho-AI distribution strategy — pre-launch account setup, Empatify SEO discovery pages, Product Hunt launch assets, influencer outreach templates.

**Architecture:** Two parallel tracks. (1) Technical: static Next.js content pages added to empatify.de for SEO/AEO, email capture on rudolpho-ai.de. (2) Manual: account registrations, Product Hunt prep, influencer DM templates, Reddit warmup.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, next-intl (en), JSON-LD schema markup. No new dependencies required.

---

## Manual Track: Pre-Launch Accounts (Do This Week)

### Task 1: Register Platform Accounts

These are manual steps — no code required.

- [ ] **Step 1: Create Product Hunt account**
  - Go to producthunt.com → sign up with your real name / @RudolphoAI brand
  - Fill in bio: "Building social games that bring people together — rudolpho-ai.de"
  - Start engaging: upvote 5 products, leave 3 genuine comments. Warms up account before your launch.

- [ ] **Step 2: Create Reddit account**
  - Username suggestion: `RudolphoAI` or `MarcoRudolphoAI`
  - Join these subreddits: r/spotify, r/indiegaming, r/partyplanning, r/AskReddit
  - **Do not post anything promotional yet.** Spend 3–5 days leaving genuine, helpful comments in r/spotify (e.g., answer "what are good party playlists" type posts). New accounts that post promotions immediately get shadowbanned.

- [ ] **Step 3: Sign up for Modash free tier**
  - Go to modash.io → create account
  - Search for TikTok creators using these filters:
    - Follower range: 5,000–50,000
    - Niche keywords: "music reaction", "spotify", "party games", "friend group"
  - Export or note 15–20 creator handles for outreach in Task 5

- [ ] **Step 4: Verify @RudolphoAI Twitter/X profile**
  - Confirm bio says "Rudolpho-AI — building social games that bring people together"
  - Add rudolpho-ai.de as website link
  - Profile photo should use the FlowerIcon or a logo — not a blank avatar

---

## Technical Track: Empatify SEO Pages

### Task 2: Create SEO Page Layout Component

**Files:**
- Create: `src/app/games/layout.tsx`
- Create: `src/app/games/page-shell.tsx`

These pages live outside `[locale]` routing — clean English-first URLs at `/games/*` and `/compare/*`.

- [ ] **Step 1: Create the games directory and shared shell component**

Create `src/app/games/page-shell.tsx`:

```tsx
import Link from 'next/link';

interface SeoPageShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SeoPageShell({ title, description, children }: SeoPageShellProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 py-4 px-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <span className="font-black text-lg tracking-tight text-white" style={{ fontFamily: 'Unbounded, sans-serif' }}>
            empatify
          </span>
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4 text-white">{title}</h1>
        <p className="text-neutral-400 text-lg mb-10">{description}</p>
        {children}
        <div className="mt-16 p-6 bg-neutral-900 rounded-xl border border-neutral-800 text-center">
          <p className="text-neutral-300 mb-4 text-lg">Ready to find out if your friends really know your music taste?</p>
          <Link
            href="/"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-lg transition-colors"
          >
            Play Empatify Free
          </Link>
        </div>
      </main>
      <footer className="border-t border-neutral-800 py-6 px-6 text-center text-neutral-500 text-sm">
        © 2026 Rudolpho-AI · <Link href="/de/impressum" className="hover:text-neutral-300">Impressum</Link>
      </footer>
    </div>
  );
}
```

Create `src/app/games/layout.tsx`:

```tsx
export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/games/
git commit -m "feat(seo): add SEO page shell component for discovery pages"
```

---

### Task 3: Spotify Party Game Page

**Files:**
- Create: `src/app/games/spotify-party-game/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/games/spotify-party-game/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { SeoPageShell } from '../page-shell';

export const metadata: Metadata = {
  title: 'Spotify Party Game Online — Play with Friends | Empatify',
  description: 'The best Spotify party game to play online with friends. Pick songs, rate each other, and find out who really knows the group. Free to play.',
  openGraph: {
    title: 'Spotify Party Game Online — Empatify',
    description: 'Pick songs, rate each other, find out who really knows the group.',
    url: 'https://empatify.de/games/spotify-party-game',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the best Spotify party game to play online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Empatify is a multiplayer Spotify party game where each player picks a song and everyone rates each other\'s picks. The player with the highest average rating wins. It runs in the browser — no app download needed.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many players can join a Spotify party game on Empatify?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Free games support up to 3 players. Pro games support unlimited players.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do all players need a Spotify account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The host needs a Spotify account to search and submit songs. Guests can join and rate without one.',
      },
    },
  ],
};

export default function SpotifyPartyGamePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoPageShell
        title="Spotify Party Game Online"
        description="Pick songs, rate each other, and find out who really knows the group."
      >
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">What is a Spotify party game?</h2>
            <p className="text-neutral-300">
              A Spotify party game uses real songs from Spotify to create a shared experience. Players pick tracks, 
              others rate them, and the results reveal who has the best read on the group. Empatify is the leading 
              browser-based version — no app download, no setup.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">How to play Empatify</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-300">
              <li>One player creates a lobby and shares the link</li>
              <li>Everyone joins — no account needed to rate</li>
              <li>Each round, every player searches and picks a Spotify song</li>
              <li>All players rate each other's picks from 1–10</li>
              <li>Highest average rating wins the round</li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Why it works as a party game</h2>
            <p className="text-neutral-300">
              The twist: you win by picking songs your <em>friends</em> will love, not songs you love. 
              That requires empathy — understanding the room. It's a music taste game where knowing your 
              friends is the actual skill being tested.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-white">Do I need Spotify Premium?</h3>
                <p className="text-neutral-400">No. Spotify Free works. The host needs a Spotify account to search songs; guests can join without one.</p>
              </div>
              <div>
                <h3 className="font-medium text-white">How many players can join?</h3>
                <p className="text-neutral-400">Free lobbies support up to 3 players. Pro lobbies support unlimited players.</p>
              </div>
              <div>
                <h3 className="font-medium text-white">Is it free?</h3>
                <p className="text-neutral-400">Yes. Core gameplay is free. Pro features (unlimited players, category games, mood card) are available on the Pro plan.</p>
              </div>
            </div>
          </div>
        </section>
      </SeoPageShell>
    </>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Run dev server: `npm run dev`
Navigate to: `http://localhost:3000/games/spotify-party-game`
Expected: Page renders with dark theme, H1 "Spotify Party Game Online", FAQ section, CTA button linking to `/`

- [ ] **Step 3: Commit**

```bash
git add src/app/games/spotify-party-game/
git commit -m "feat(seo): add /games/spotify-party-game discovery page"
```

---

### Task 4: Music Game Friends Page

**Files:**
- Create: `src/app/games/music-game-friends/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/games/music-game-friends/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { SeoPageShell } from '../page-shell';

export const metadata: Metadata = {
  title: 'Music Games to Play with Friends Online | Empatify',
  description: 'The best music game to play with friends online. Use Spotify, pick songs, rate each other — find out who really knows the group. Free to play.',
  openGraph: {
    title: 'Music Games to Play with Friends Online — Empatify',
    description: 'Pick songs, rate each other, find out who really knows the group.',
    url: 'https://empatify.de/games/music-game-friends',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What are the best music games to play with friends online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Empatify is a multiplayer music game where friends each pick a Spotify song and rate each other\'s picks. It tests how well you know your friends\' music taste — no download required, plays in any browser.',
      },
    },
    {
      '@type': 'Question',
      name: 'What makes Empatify different from other music games?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most music games test trivia knowledge. Empatify tests empathy — you win by picking songs your friends will love, not songs you love yourself. The social dynamic is what makes it interesting.',
      },
    },
  ],
};

export default function MusicGameFriendsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoPageShell
        title="Music Games to Play with Friends Online"
        description="The game that finds out if you really know your friends' music taste."
      >
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Why music games hit different with friends</h2>
            <p className="text-neutral-300">
              Trivia games test memory. Music games test identity. When your friend picks a song and you have 
              to rate it, you're revealing exactly how well you know them — and how well they know you.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Best online music games for friend groups (2026)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-neutral-300 border-collapse">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="py-3 pr-6 text-white font-medium">Game</th>
                    <th className="py-3 pr-6 text-white font-medium">How it works</th>
                    <th className="py-3 text-white font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  <tr>
                    <td className="py-3 pr-6 font-medium text-orange-400">Empatify</td>
                    <td className="py-3 pr-6">Pick Spotify songs, friends rate them. Empathy wins.</td>
                    <td className="py-3">Free</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6">Jackbox (Drawful / Quiplash)</td>
                    <td className="py-3 pr-6">Party games, some music-adjacent. Requires purchase.</td>
                    <td className="py-3">$9.99+</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6">Heardle</td>
                    <td className="py-3 pr-6">Solo song-guessing game. Not multiplayer.</td>
                    <td className="py-3">Free</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6">Song Pop</td>
                    <td className="py-3 pr-6">Music trivia against friends. Mobile-first.</td>
                    <td className="py-3">Free (ads)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">How to start a music game with friends in 60 seconds</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-300">
              <li>Go to empatify.de and create a free account</li>
              <li>Create a lobby — choose number of rounds (1–10)</li>
              <li>Share the lobby link with your friends</li>
              <li>Each round: search Spotify, pick your song, submit</li>
              <li>Rate each other's picks, see the leaderboard</li>
            </ol>
          </div>
        </section>
      </SeoPageShell>
    </>
  );
}
```

- [ ] **Step 2: Verify**

Navigate to: `http://localhost:3000/games/music-game-friends`
Expected: Page renders with comparison table, numbered steps, CTA

- [ ] **Step 3: Commit**

```bash
git add src/app/games/music-game-friends/
git commit -m "feat(seo): add /games/music-game-friends discovery page"
```

---

### Task 5: Jackbox Alternative Page

**Files:**
- Create: `src/app/compare/jackbox-alternative/page.tsx`
- Create: `src/app/compare/layout.tsx`

- [ ] **Step 1: Create compare layout**

Create `src/app/compare/layout.tsx`:

```tsx
export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Create the page**

Create `src/app/compare/jackbox-alternative/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { SeoPageShell } from '../../games/page-shell';

export const metadata: Metadata = {
  title: 'Free Jackbox Alternative Online — No Purchase Required | Empatify',
  description: 'Looking for a free Jackbox alternative? Empatify is a browser-based multiplayer music game. No purchase, no download — just share a link and play.',
  openGraph: {
    title: 'Free Jackbox Alternative — Empatify',
    description: 'Browser-based multiplayer game. No purchase needed.',
    url: 'https://empatify.de/compare/jackbox-alternative',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a good free alternative to Jackbox Games?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Empatify is a free browser-based multiplayer game that works like a social music game. Players each pick a Spotify song per round, rate each other, and the highest average rating wins. No purchase required — create a lobby and share the link.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Empatify work without downloading anything?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Empatify runs entirely in the browser. The host creates a lobby and shares the link — guests join without creating an account or downloading anything.',
      },
    },
  ],
};

export default function JackboxAlternativePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoPageShell
        title="Free Jackbox Alternative Online"
        description="Browser-based multiplayer fun. No purchase, no download — just share a link."
      >
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Jackbox vs Empatify — quick comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-neutral-300 border-collapse">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="py-3 pr-6 text-white font-medium"></th>
                    <th className="py-3 pr-6 text-white font-medium">Jackbox</th>
                    <th className="py-3 text-orange-400 font-medium">Empatify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  <tr>
                    <td className="py-3 pr-6 text-neutral-400">Price</td>
                    <td className="py-3 pr-6">$9.99–$29.99 per pack</td>
                    <td className="py-3 text-orange-400">Free</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6 text-neutral-400">Download required</td>
                    <td className="py-3 pr-6">Yes (host needs Steam/console)</td>
                    <td className="py-3 text-orange-400">No — browser only</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6 text-neutral-400">Players</td>
                    <td className="py-3 pr-6">Up to 8 (varies by game)</td>
                    <td className="py-3 text-orange-400">3 free / unlimited Pro</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6 text-neutral-400">Music-based</td>
                    <td className="py-3 pr-6">Some packs only</td>
                    <td className="py-3 text-orange-400">Yes — Spotify integration</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6 text-neutral-400">Accounts needed</td>
                    <td className="py-3 pr-6">Host needs Steam</td>
                    <td className="py-3 text-orange-400">Guests join without account</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">When Empatify beats Jackbox</h2>
            <ul className="list-disc list-inside space-y-2 text-neutral-300">
              <li>You want something free with no purchase barrier</li>
              <li>Your group is into music and Spotify</li>
              <li>You're playing remotely and don't want to coordinate a download</li>
              <li>You want a game that tests how well you know each other, not trivia</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">When Jackbox is the better pick</h2>
            <ul className="list-disc list-inside space-y-2 text-neutral-300">
              <li>You want variety across many game types in one pack</li>
              <li>Your group prefers drawing or word games over music</li>
              <li>You're willing to pay for more polished production</li>
            </ul>
          </div>
        </section>
      </SeoPageShell>
    </>
  );
}
```

- [ ] **Step 3: Verify**

Navigate to: `http://localhost:3000/compare/jackbox-alternative`
Expected: Page renders with comparison table, pros/cons sections, CTA

- [ ] **Step 4: Commit**

```bash
git add src/app/compare/
git commit -m "feat(seo): add /compare/jackbox-alternative discovery page"
```

---

### Task 6: Spotify Quiz Multiplayer Page

**Files:**
- Create: `src/app/games/spotify-quiz-multiplayer/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/games/spotify-quiz-multiplayer/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { SeoPageShell } from '../page-shell';

export const metadata: Metadata = {
  title: 'Spotify Quiz Multiplayer — Play Online with Friends | Empatify',
  description: 'A Spotify quiz game you play live with friends. Pick songs each round, rate each other\'s choices, see who wins. Free, browser-based, no download.',
  openGraph: {
    title: 'Spotify Quiz Multiplayer — Empatify',
    description: 'Pick songs, rate friends, find out who wins.',
    url: 'https://empatify.de/games/spotify-quiz-multiplayer',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the best multiplayer Spotify quiz game?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Empatify is a real-time multiplayer Spotify game where players each pick a song per round and rate each other\'s choices. It\'s more social than trivia — you win by knowing what your friends will like.',
      },
    },
  ],
};

export default function SpotifyQuizMultiplayerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoPageShell
        title="Spotify Quiz Multiplayer"
        description="Real-time, friend-vs-friend. Pick songs, rate each other, see who wins."
      >
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">How this Spotify quiz game works</h2>
            <p className="text-neutral-300">
              Unlike trivia-style Spotify quizzes, Empatify is active — every player picks a song each round, 
              not just guesses. You search Spotify live, submit your pick, then everyone rates every submission 
              from 1–10. Highest average score wins.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">What makes it multiplayer</h2>
            <ul className="list-disc list-inside space-y-2 text-neutral-300">
              <li>Everyone plays simultaneously — no waiting for your turn</li>
              <li>Real-time ratings — see scores as they come in</li>
              <li>Live leaderboard updates every round</li>
              <li>Up to 3 players free, unlimited with Pro</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Setting up a game in under 2 minutes</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-300">
              <li>Create a free account at empatify.de</li>
              <li>Hit "Create Game" — choose 1–10 rounds</li>
              <li>Share the lobby link in your group chat</li>
              <li>Wait for players to join, then start</li>
            </ol>
          </div>
        </section>
      </SeoPageShell>
    </>
  );
}
```

- [ ] **Step 2: Verify**

Navigate to: `http://localhost:3000/games/spotify-quiz-multiplayer`
Expected: Page renders correctly with dark theme, H2 sections, CTA

- [ ] **Step 3: Commit**

```bash
git add src/app/games/spotify-quiz-multiplayer/
git commit -m "feat(seo): add /games/spotify-quiz-multiplayer discovery page"
```

---

## Manual Track: Product Hunt Launch Prep

### Task 7: Prepare Product Hunt Assets

- [ ] **Step 1: Write tagline**

One-sentence tagline (under 60 chars):
> "Find out if your friends really know your music taste."

- [ ] **Step 2: Write Product Hunt description**

```
Empatify is a multiplayer music game built on Spotify.

Each round, every player picks a song — then everyone rates each other's picks from 1–10. The player with the highest average rating wins. The twist: you win by picking songs your friends will love, not songs you love.

Empathy is the skill being tested. That's why it's called Empatify.

→ Free to play, browser-based, no download
→ Spotify search built in
→ Real-time leaderboard
→ Pro: unlimited players, AI category games, mood card
```

- [ ] **Step 3: Record 60-second demo video**

Script:
1. 0–5s: Show lobby creation ("Let me show you how to set up a game in 60 seconds")
2. 5–20s: Show song search + submission in real time
3. 20–40s: Show rating screen (all players rating simultaneously)
4. 40–55s: Show leaderboard reveal
5. 55–60s: End card with empatify.de

Tools: Loom (free), OBS, or screen record on Mac/Windows.

- [ ] **Step 4: Schedule launch day**

Pick a Tuesday, Wednesday, or Thursday. Product Hunt resets at 12:01am PST.
Best window: launch at 12:05am PST to get a full day of votes.

- [ ] **Step 5: Draft first comment (post this immediately when live)**

```
Hey PH 👋 I'm Marco, the solo builder behind Empatify.

I built this after noticing something at a party: everyone has an opinion on music, but almost nobody can actually predict what their friends will like. Empatify turns that into a game.

The idea is simple — pick a Spotify song each round, everyone rates each other's picks. You win by knowing your friends, not by having "good taste."

Would love to hear your first reactions. What game modes would you want to see next?
```

---

## Manual Track: TikTok Influencer Outreach

### Task 8: Write Influencer DM Templates

- [ ] **Step 1: Write outreach DM**

Use this template — keep it short, specific, human:

```
Hey [name] — your [specific video, e.g. "Spotify wrapped reaction"] was great.

I built a multiplayer music game called Empatify — players pick Spotify songs each round and rate each other's picks. It's basically "how well do you know your friends' music taste."

Would love to give you free Pro access to try with your friends. No strings, no script — just thought it could be fun content if it lands.

Let me know! — Marco
```

- [ ] **Step 2: Find 15 creators using Modash**

Search filters:
- Platform: TikTok
- Followers: 5,000–50,000
- Niche: music, music reaction, party, friend group, spotify

Note their handles in a simple spreadsheet: handle | follower count | last post | DM sent (y/n) | response

- [ ] **Step 3: Send DMs**

Send to all 15. Track responses in the spreadsheet.
Follow up once after 5 days if no response — then move on.

---

## Manual Track: Reddit Posts

### Task 9: Draft Reddit Launch Posts

Write these posts now; post them on launch day after account is warmed up.

- [ ] **Step 1: r/spotify post**

**Title:** I built a game where you pick songs for your friends and they rate you — here's what happened when I tested it

**Body:**
```
Been lurking here for years and finally built something I've wanted for a long time.

The premise: every player picks one Spotify song per round. Everyone rates each other's picks 1–10. You win by picking songs your *friends* will love, not songs you love.

Tested it at a friend's place last week. The arguments about song choices were honestly better than the game itself.

It's called Empatify (empathy + Spotify). Free to play, browser-based. Would love feedback from people who actually care about music.

Link in comments.
```

- [ ] **Step 2: r/indiegaming post**

**Title:** Built a browser-based party game around Spotify song picking — would love harsh feedback

**Body:**
```
Solo dev here. Built a multiplayer party game that runs in the browser — no download, share a link and play.

The mechanic: each round every player searches Spotify and picks a song. Then everyone rates each other's picks. Highest average rating wins. The interesting bit is that you win by knowing your friends' taste, not by having "good" taste — so it rewards empathy over ego.

Stack: Next.js, Supabase, Spotify API.

Happy to take any feedback on the concept, UX, or game balance. Be brutal — it's the only way to improve.

[empatify.de]
```

---

## Manual Track: Twitter Launch Posts

### Task 10: Draft Twitter Launch Content

- [ ] **Step 1: Write origin story tweet (post on launch day)**

```
I built a game that tells you if you actually know your friends.

Each round, everyone picks a Spotify song. Then everyone rates each other's picks.

You don't win by having "good taste." You win by knowing what your friends will love.

It's called Empatify. It's free. Try it 👇
[link]
```

- [ ] **Step 2: Write 3 gameplay moment tweets (post week 1)**

Template A — reaction hook:
```
Someone in our test session picked a death metal song in round 3 of a chill Sunday game.

They came last. Empathy matters.

[screenshot of leaderboard]
```

Template B — insight hook:
```
After 50 Empatify games: the people who win most consistently are not the ones with the best music taste.

They're the ones who listen the most.

[link]
```

Template C — build-in-public:
```
Shipped Empatify after [X] months of building solo.

Stack: Next.js · Supabase · Spotify API · Drizzle ORM

If you want to see how it's built, I'll share more. Drop a 🎵 below.
```

- [ ] **Step 3: Schedule posts**

Use Twitter's native scheduler or Buffer (free tier):
- Launch day: origin story tweet
- Day 2: reaction hook tweet
- Day 4: build-in-public tweet
- Day 7: insight hook tweet

---

## What's Out of Scope for Now

The following pages from the spec belong to **separate repos** — implement them when those codebases are available:

| Page | Domain | Repo |
|---|---|---|
| `/games/first-date-games` | date-talk.de | datetalk repo (not yet built) |
| `/games/icebreaker-couples` | date-talk.de | datetalk repo |
| `/games/get-to-know-you-game` | date-talk.de | datetalk repo |
| `/tools/ai-instagram-dm-agent` | rudolpho-chat.de | rudolpho-chat repo |
| `/games/social-games-online-2026` | rudolpho-ai.de | rudolpho-ai repo |
| `/about/ai-social-games-studio` | rudolpho-ai.de | rudolpho-ai repo |
| Email capture form | rudolpho-ai.de | rudolpho-ai repo |
| Newsletter setup | rudolpho-ai.de | rudolpho-ai repo |

These are **month 2–3 tasks** — the empatify.de pages above are the week 1 priority.
