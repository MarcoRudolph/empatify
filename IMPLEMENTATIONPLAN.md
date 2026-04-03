---
description: "Empatify feature roadmap — 10 Ralph-optimised slices, one commit each"
paths:
  - "./FEATURE.md"
  - "./src/lib/db/schema.ts"
  - "./src/app/[locale]/dashboard/CreateGameSection.tsx"
  - "./src/app/api/lobby/[id]/song/route.ts"
  - "./src/app/api/lobby/create/route.ts"
  - "./src/app/lobby/[id]/LobbyPageClient.tsx"
---

# Empatify — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Each slice = one commit. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Ralph loop:** This plan is optimised for `max-iterations 10`. Each slice is completable in one iteration. Run: `/ralph-loop:ralph-loop implement all 10 slices from IMPLEMENTATIONPLAN.md [max-iterations 10]`

**Goal:** Pro Plan trial gating, player limits, Round Prompts, Blind Mode + Guess the Submitter, Post-Game Mood Card, Playlist Export, Game History, and Top 5 Songs stat — all on the existing Next.js + Drizzle + Supabase stack.

**Architecture:** One migration adds all new columns at once (Slice 1). A `checkCategoryAccess` helper centralises trial logic. New features extend `lobbies` with nullable columns (backward-compatible). All AI calls are metered via `users.ai_tokens_used`.

**Tech Stack:** Next.js 14 App Router · Drizzle ORM + `postgresClient` raw SQL · Supabase PostgreSQL · OpenAI gpt-4o-mini · Spotify Web API · Tailwind CSS · TypeScript

**Pro Plan summary:**

| Feature | Free | Pro |
|---|---|---|
| Players per lobby | Max 3 | Unlimited |
| Rounds | Free choice 1–10 | Free choice 1–10 |
| Category games | 4-week / $1 token trial | Always on |
| Round Prompts (create) | — | ✓ |
| Blind Mode | — | ✓ |
| Post-Game Mood Card | Blurred preview | Full + shareable |
| Playlist Export | Top 3 | Full game |
| Game History | Last 3 games | Full + stats |
| Friends & Messaging | ✓ both | ✓ both |

---

## Slice 1 — DB Foundation

**One commit. All new columns and tables added here. Nothing else touches the DB schema.**

**Files:**
- Modify: `src/lib/db/schema.ts`
- Run: `npx drizzle-kit push`

- [ ] **Step 1: Add columns to `users` and `lobbies`, add `submitter_guesses` table**

In `src/lib/db/schema.ts`, apply these changes:

```typescript
// In users pgTable — add after createdAt:
aiTrialStartedAt: timestamp('ai_trial_started_at', { withTimezone: true }),
aiTokensUsed: integer('ai_tokens_used').default(0).notNull(),

// In lobbies pgTable — add after gameMode:
roundPrompts: text('round_prompts').array(),
isBlind: boolean('is_blind').default(false).notNull(),
```

Add new table after the `friends` table definition:

```typescript
export const submitterGuesses = pgTable('submitter_guesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  lobbyId: uuid('lobby_id').notNull().references(() => lobbies.id, { onDelete: 'cascade' }),
  songId: uuid('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
  guesserId: uuid('guesser_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  guessedUserId: uuid('guessed_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isCorrect: boolean('is_correct').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueSongGuesser: unique().on(table.songId, table.guesserId),
}))
```

Add type exports at the bottom of schema.ts:
```typescript
export type SubmitterGuess = typeof submitterGuesses.$inferSelect;
export type NewSubmitterGuess = typeof submitterGuesses.$inferInsert;
```

- [ ] **Step 2: Push schema to database**

```bash
npx drizzle-kit push
```

Expected: no errors. Verify in Supabase table editor: `users` has `ai_trial_started_at` + `ai_tokens_used`, `lobbies` has `round_prompts` + `is_blind`, table `submitter_guesses` exists.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "feat(db): add AI trial columns, round_prompts, is_blind, submitter_guesses"
```

---

## Slice 2 — Pro Trial Gate + Token Tracking

**One commit. Trial eligibility helper + integration into the song submission route.**

**Files:**
- Create: `src/lib/plan/checkCategoryAccess.ts`
- Modify: `src/app/api/lobby/[id]/song/route.ts`

- [ ] **Step 1: Create trial helper**

Create `src/lib/plan/checkCategoryAccess.ts`:

```typescript
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: "trial_expired" | "budget_exceeded" | "no_access" }

// ~$1 at gpt-4o-mini rates ($0.15/1M input tokens, ~12 tokens/call = ~6,666 calls)
const TOKEN_BUDGET = 6600
const TRIAL_DAYS = 28

export async function checkCategoryAccess(userId: string): Promise<AccessResult> {
  const [user] = await db
    .select({
      proPlan: users.proPlan,
      aiTrialStartedAt: users.aiTrialStartedAt,
      aiTokensUsed: users.aiTokensUsed,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) return { allowed: false, reason: "no_access" }
  if (user.proPlan) return { allowed: true }

  // Start trial on first use
  if (!user.aiTrialStartedAt) {
    await db.update(users).set({ aiTrialStartedAt: new Date() }).where(eq(users.id, userId))
    return { allowed: true }
  }

  const expiry = new Date(user.aiTrialStartedAt)
  expiry.setDate(expiry.getDate() + TRIAL_DAYS)
  if (new Date() > expiry) return { allowed: false, reason: "trial_expired" }
  if (user.aiTokensUsed >= TOKEN_BUDGET) return { allowed: false, reason: "budget_exceeded" }

  return { allowed: true }
}

export async function recordTokenUsage(userId: string, tokensUsed: number): Promise<void> {
  await db
    .update(users)
    .set({ aiTokensUsed: sql`${users.aiTokensUsed} + ${tokensUsed}` })
    .where(eq(users.id, userId))
}
```

- [ ] **Step 2: Integrate into song route**

In `src/app/api/lobby/[id]/song/route.ts`, add to imports:
```typescript
import { checkCategoryAccess, recordTokenUsage } from "@/lib/plan/checkCategoryAccess"
```

Inside the `if (lobby.category && lobby.category !== 'all')` block, **before** calling the validation endpoint, add:

```typescript
const access = await checkCategoryAccess(dbUser.id)
if (!access.allowed) {
  const msg: Record<string, string> = {
    trial_expired: "Your 4-week free trial has ended. Upgrade to Pro to keep playing category games.",
    budget_exceeded: "You've used your free AI validation budget. Upgrade to Pro to continue.",
    no_access: "Category games require a Pro plan.",
  }
  return NextResponse.json(
    { error: { code: "PRO_REQUIRED", message: msg[access.reason], status: 403 } },
    { status: 403 }
  )
}
```

After the `openAIResponse.ok` check, add token recording. Replace the current valid response parsing block:

```typescript
if (validationResponse.ok) {
  const validationData = await validationResponse.json()
  // Record actual tokens used (returned by OpenAI)
  const tokensUsed = validationData.tokensUsed ?? 12
  await recordTokenUsage(dbUser.id, tokensUsed)

  if (validationData.valid === false) {
    return NextResponse.json(
      {
        error: {
          code: "CATEGORY_MISMATCH",
          message: `Der Song passt nicht. Die festgelegte Kategorie für dieses Spiel lautet: ${lobby.category}.`,
          category: lobby.category,
          status: 400,
        },
      },
      { status: 400 }
    )
  }
}
```

Also update `src/app/api/ai/validate-song-category/route.ts` to return token count in response:

```typescript
// In the return statement, add tokensUsed:
return NextResponse.json(
  {
    valid: isValid,
    response: responseText,
    tokensUsed: data.usage?.prompt_tokens ?? 12,
  },
  { status: 200 }
)
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/plan/checkCategoryAccess.ts src/app/api/lobby/[id]/song/route.ts src/app/api/ai/validate-song-category/route.ts
git commit -m "feat(plan): Pro trial gate with token tracking for category validation"
```

---

## Slice 3 — Player Count Limit (Free: 3, Pro: Unlimited)

**One commit. Find the join mechanism and gate it.**

**Files:**
- Investigate: `src/app/lobby/[id]/LobbyPageClient.tsx` — find where `lobby_participants` INSERT occurs
- Modify: whichever file performs the join (likely an API call to `/api/lobby/[id]/join` or inline in `LobbyPageClient`)

- [ ] **Step 1: Locate the join mechanism**

```bash
grep -r "lobby_participants\|join.*lobby\|joinLobby\|/api/lobby" src --include="*.ts" --include="*.tsx" -l
```

- [ ] **Step 2: Add player count gate**

Find the code path where a non-host user joins a lobby. Add this check after verifying the user is not already a participant:

```typescript
// Fetch host's pro_plan status
const [host] = await db
  .select({ proPlan: users.proPlan })
  .from(users)
  .where(eq(users.id, lobby.hostId))
  .limit(1)

if (!host?.proPlan) {
  const [{ count: participantCount }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(lobbyParticipants)
    .where(eq(lobbyParticipants.lobbyId, lobbyId))

  if (Number(participantCount) >= 3) {
    return NextResponse.json(
      {
        error: {
          code: "LOBBY_FULL_FREE",
          message: "Free plan lobbies are limited to 3 players. The host needs Pro Plan to invite more.",
          status: 403,
        },
      },
      { status: 403 }
    )
  }
}
```

Needed imports: `import { sql } from "drizzle-orm"` (if not already present).

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(plan): limit free plan lobbies to 3 players"
```

---

## Slice 4 — Rounds: Free Choice 1–10 for All Users

**One commit. Remove the rounds and category disabled states from CreateGameSection.**

**Files:**
- Modify: `src/app/[locale]/dashboard/CreateGameSection.tsx`

The rounds dropdown and category dropdown are both `disabled={!isProPlan}`. This slice removes those gates — server-side trial gating (Slice 2) handles category access; rounds are now free for all.

- [ ] **Step 1: Rounds — remove Pro gate**

Find the rounds `<select>` block (around line 225–246). Replace:

```tsx
// BEFORE
<select
  id="rounds"
  value={rounds}
  onChange={(e) => setRounds(Number(e.target.value))}
  disabled={!isProPlan}
  className="..."
>
  {isProPlan ? (
    Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
      <option key={num} value={num}>{num}</option>
    ))
  ) : (
    <option value={5}>5</option>
  )}
</select>
{!isProPlan && (
  <p className="mt-1 text-xs text-neutral-500">{t("freePlanRoundsNote")}</p>
)}

// AFTER
<select
  id="rounds"
  value={rounds}
  onChange={(e) => setRounds(Number(e.target.value))}
  className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all duration-200"
>
  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
    <option key={num} value={num}>{num}</option>
  ))}
</select>
```

- [ ] **Step 2: Category — remove disabled state**

Find the category `<select>` block (around line 257–274). Remove `disabled={!isProPlan}` and the `{!isProPlan && <p>...freePlanCategoryNote...</p>}` paragraph.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/dashboard/CreateGameSection.tsx
git commit -m "feat(plan): open rounds 1-10 and category to all users (trial-gated server-side)"
```

---

## Slice 5 — Round Prompts: DB + API

**One commit. Save and return prompts through the lobby create and GET APIs.**

**Files:**
- Modify: `src/app/api/lobby/create/route.ts`
- Modify: `src/app/api/lobby/[id]/route.ts`

- [ ] **Step 1: Accept `roundPrompts` in lobby create**

In `src/app/api/lobby/create/route.ts`, extract from request body:

```typescript
const { rounds, category, gameMode, copyFromLobbyId, roundPrompts } = body
```

Declare a variable:
```typescript
let lobbyRoundPrompts: string[] | null = null
```

After the `maxRounds`/`lobbyCategory` processing block, add:
```typescript
// Round prompts: filter out empty strings, null if none provided
lobbyRoundPrompts = Array.isArray(roundPrompts) && roundPrompts.some(Boolean)
  ? roundPrompts.map((p: string) => p?.trim() ?? "")
  : null
```

In the Drizzle insert (both the `gameModeColumnExists` and fallback branches), add `roundPrompts: lobbyRoundPrompts, isBlind: false` to the `.values({...})` call.

In the response JSON, include:
```typescript
roundPrompts: newLobby.roundPrompts ?? null,
isBlind: newLobby.isBlind ?? false,
```

- [ ] **Step 2: Return prompts in lobby GET**

In `src/app/api/lobby/[id]/route.ts`, the lobby response object around line 282:

```typescript
lobby: {
  id: lobby.id,
  hostId: lobby.hostId,
  maxRounds: lobby.maxRounds,
  category: lobby.category,
  gameMode: lobby.gameMode,
  roundPrompts: lobby.roundPrompts ?? null,   // ADD
  isBlind: lobby.isBlind ?? false,            // ADD
  createdAt: lobby.createdAt.toISOString(),
},
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/lobby/create/route.ts src/app/api/lobby/[id]/route.ts
git commit -m "feat(prompts): save and return round_prompts and is_blind in lobby API"
```

---

## Slice 6 — Round Prompts: UI

**One commit. Prompt inputs in game creation, prompt display in song selection, rating label change.**

**Files:**
- Modify: `src/app/[locale]/dashboard/CreateGameSection.tsx`
- Modify: `src/app/lobby/[id]/select-song/SelectSongPageClient.tsx`

- [ ] **Step 1: Add prompt state + inputs in CreateGameSection**

Add state after existing state declarations:
```typescript
const [prompts, setPrompts] = useState<string[]>(Array(rounds).fill(""))
```

Add an effect to resize prompts array when rounds changes:
```typescript
useEffect(() => {
  setPrompts((prev) => {
    const next = Array(rounds).fill("")
    return next.map((_, i) => prev[i] ?? "")
  })
}, [rounds])
```

Pass prompts to the create request body inside `handleCreateGame`:
```typescript
const requestBody = {
  rounds,
  category: category === "all" ? null : category,
  gameMode,
  roundPrompts: prompts,
}
```

Render prompt inputs below the category selector (before the invite friends button):
```tsx
<div>
  <label className="block text-sm font-medium text-neutral-900 mb-2">
    Round Prompts
    <span className="text-xs text-neutral-400 ml-2">(optional — Pro feature)</span>
  </label>
  <div className="space-y-2">
    {Array.from({ length: rounds }, (_, i) => (
      <input
        key={i}
        value={prompts[i] ?? ""}
        onChange={(e) => {
          const next = [...prompts]
          next[i] = e.target.value
          setPrompts(next)
        }}
        placeholder={`Round ${i + 1} — e.g. "A song your dad dances to"`}
        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      />
    ))}
  </div>
</div>
```

- [ ] **Step 2: Show prompt in SelectSongPageClient**

In `src/app/lobby/[id]/select-song/SelectSongPageClient.tsx`, find where `roundNumber` / `currentRound` is used. After the round display, add:

```tsx
{lobby?.roundPrompts?.[roundNumber - 1] && (
  <div className="mb-4 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-500 mb-1">
      Round Prompt
    </p>
    <p className="text-base font-semibold text-neutral-900">
      {lobby.roundPrompts[roundNumber - 1]}
    </p>
    <p className="text-xs text-neutral-500 mt-1">
      Pick a song that fits this vibe — not your favourite.
    </p>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/dashboard/CreateGameSection.tsx src/app/lobby/[id]/select-song/SelectSongPageClient.tsx
git commit -m "feat(prompts): Round Prompts UI — inputs in creation, display in song selection"
```

---

## Slice 7 — Blind Mode: Toggle + Submission

**One commit. Blind toggle in game creation, isBlind saved on create.**

**Files:**
- Modify: `src/app/[locale]/dashboard/CreateGameSection.tsx`
- Modify: `src/app/api/lobby/create/route.ts`

- [ ] **Step 1: Add isBlind state and toggle to CreateGameSection**

Add state:
```typescript
const [isBlind, setIsBlind] = useState(false)
```

Pass to request body:
```typescript
const requestBody = {
  rounds,
  category: category === "all" ? null : category,
  gameMode,
  roundPrompts: prompts,
  isBlind,
}
```

Render toggle below the round prompts section:
```tsx
<label className="flex items-center gap-3 cursor-pointer select-none">
  <div
    onClick={() => setIsBlind(!isBlind)}
    className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
      isBlind ? "bg-primary-500" : "bg-neutral-300"
    }`}
  >
    <span
      className={`absolute top-1 left-1 size-4 bg-white rounded-full shadow transition-transform duration-200 ${
        isBlind ? "translate-x-4" : "translate-x-0"
      }`}
    />
  </div>
  <div>
    <span className="text-sm font-medium text-neutral-900">Blind Mode</span>
    <span className="block text-xs text-neutral-400">
      Submitters hidden until all ratings are in — then everyone guesses who picked what
    </span>
  </div>
</label>
```

- [ ] **Step 2: Save isBlind in create route**

In `src/app/api/lobby/create/route.ts`, extract from body:
```typescript
const { rounds, category, gameMode, copyFromLobbyId, roundPrompts, isBlind } = body
```

Declare:
```typescript
const lobbyIsBlind = Boolean(isBlind)
```

Add to both `.values({...})` insert branches:
```typescript
isBlind: lobbyIsBlind,
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/dashboard/CreateGameSection.tsx src/app/api/lobby/create/route.ts
git commit -m "feat(blind): Blind Mode toggle in game creation"
```

---

## Slice 8 — Blind Mode: Rating UI + Guess the Submitter

**One commit. Hide submitters during rating in blind lobbies. Guess screen + API + bonus scoring.**

**Files:**
- Modify: `src/app/lobby/[id]/SongsCard.tsx` (or wherever song submitter name is shown during rating)
- Create: `src/app/api/lobby/[id]/guess-submitter/route.ts`
- Modify: `src/app/lobby/[id]/LobbyPageClient.tsx`

- [ ] **Step 1: Hide submitter in SongsCard when blind**

In `src/app/lobby/[id]/SongsCard.tsx`, receive `isBlind` and `allRatingsComplete` as props. When `isBlind && !allRatingsComplete`, replace the submitter name display:

```tsx
// BEFORE: show user name
<span>{song.suggestedByName}</span>

// AFTER: conditional
{isBlind && !allRatingsComplete ? (
  <span className="inline-flex items-center gap-1.5 text-neutral-400 text-sm">
    <span className="size-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold">?</span>
    Hidden
  </span>
) : (
  <span>{song.suggestedByName}</span>
)}
```

`allRatingsComplete` = every non-submitter participant has rated every song in this round.

- [ ] **Step 2: Create guess-submitter API**

Create `src/app/api/lobby/[id]/guess-submitter/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { submitterGuesses, songs, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// POST /api/lobby/[id]/guess-submitter
// Body: { guesses: { songId: string; guessedUserId: string }[] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: lobbyId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: { code: "UNAUTHORIZED", status: 401 } }, { status: 401 })

  const [dbUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, user.email!)).limit(1)
  if (!dbUser) return NextResponse.json({ error: { code: "USER_NOT_FOUND", status: 404 } }, { status: 404 })

  const { guesses } = await request.json() as { guesses: { songId: string; guessedUserId: string }[] }

  let correct = 0
  const results = []

  for (const { songId, guessedUserId } of guesses) {
    const [song] = await db.select({ suggestedBy: songs.suggestedBy }).from(songs).where(eq(songs.id, songId)).limit(1)
    if (!song) continue
    const isCorrect = song.suggestedBy === guessedUserId
    if (isCorrect) correct++

    await db
      .insert(submitterGuesses)
      .values({ lobbyId, songId, guesserId: dbUser.id, guessedUserId, isCorrect })
      .onConflictDoNothing()

    results.push({ songId, guessedUserId, isCorrect, actualUserId: song.suggestedBy })
  }

  return NextResponse.json({ correct, total: guesses.length, results }, { status: 200 })
}
```

- [ ] **Step 3: Add bonus to leaderboard in GET route**

In `src/app/api/lobby/[id]/route.ts`, after the leaderboard calculation, fetch correct guess counts per user and add as `bonusGuesses`:

```typescript
// Fetch bonus points from submitter_guesses
const guessCounts = await db
  .select({ guesserId: submitterGuesses.guesserId, count: sql<number>`COUNT(*)` })
  .from(submitterGuesses)
  .where(and(eq(submitterGuesses.lobbyId, id), eq(submitterGuesses.isCorrect, true)))
  .groupBy(submitterGuesses.guesserId)

const bonusMap = new Map(guessCounts.map(g => [g.guesserId, Number(g.count)]))

// In the leaderboard map conversion, add:
bonusGuesses: bonusMap.get(entry.userId) ?? 0,
```

Required additional import at top of file:
```typescript
import { submitterGuesses } from "@/lib/db/schema"
import { sql } from "drizzle-orm"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/lobby/[id]/SongsCard.tsx src/app/api/lobby/[id]/guess-submitter/route.ts src/app/api/lobby/[id]/route.ts
git commit -m "feat(blind): hide submitters + Guess the Submitter API + bonus scoring"
```

---

## Slice 9 — Post-Game Mood Card

**One commit. AI mood endpoint, MoodCard component, trigger on game finish.**

**Files:**
- Create: `src/app/api/ai/game-mood/route.ts`
- Create: `src/components/ui/MoodCard.tsx`
- Modify: `src/app/lobby/[id]/LeaderboardCard.tsx`

- [ ] **Step 1: AI game-mood endpoint**

Create `src/app/api/ai/game-mood/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface SongEntry { playerName: string; trackName: string; artist: string }

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", status: 401 } }, { status: 401 })

  const apiKey = process.env.CHATGPT_APIKEY
  if (!apiKey) return NextResponse.json({ error: { code: "CONFIG_ERROR", status: 500 } }, { status: 500 })

  const { songs } = await request.json() as { songs: SongEntry[] }

  const songList = songs.map(s => `- ${s.playerName}: "${s.trackName} - ${s.artist}"`).join('\n')
  const prompt = `Songs submitted:\n${songList}\n\nAnalyse collective mood (2 sentences max). Compare each player's music personality (1 sentence each, first name only). Suggest one next-game theme (max 10 words).\nReply only in JSON: {"collective_mood":"...","profiles":{"NAME":"..."},"next_prompt":"..."}`

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 300, temperature: 0.7 }),
  })

  if (!res.ok) return NextResponse.json({ error: { code: "OPENAI_ERROR", status: res.status } }, { status: res.status })

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim() ?? "{}"
  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed, { status: 200 })
  } catch {
    return NextResponse.json({ error: { code: "PARSE_ERROR", message: text, status: 500 } }, { status: 500 })
  }
}
```

- [ ] **Step 2: MoodCard component**

Create `src/components/ui/MoodCard.tsx`:

```tsx
"use client"

import { Sparkles } from "lucide-react"

interface MoodCardProps {
  collectiveMood: string
  profiles: Record<string, string>
  nextPrompt: string
  isBlurred?: boolean
}

export function MoodCard({ collectiveMood, profiles, nextPrompt, isBlurred = false }: MoodCardProps) {
  return (
    <div className="relative rounded-2xl border border-primary-500/30 bg-gradient-to-br from-primary-500/5 to-primary-600/10 p-6 shadow-lg overflow-hidden">
      {isBlurred && (
        <div className="absolute inset-0 backdrop-blur-md bg-neutral-50/60 flex flex-col items-center justify-center z-10 rounded-2xl">
          <Sparkles className="size-8 text-primary-500 mb-2" />
          <p className="font-semibold text-neutral-900 text-sm">Pro feature</p>
          <p className="text-xs text-neutral-500">Upgrade to see your mood card</p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-5 text-primary-500" />
        <h3 className="font-display font-black text-lg tracking-tight text-neutral-900">Mood Report</h3>
      </div>

      <p className="text-sm text-neutral-700 leading-relaxed mb-4 italic">"{collectiveMood}"</p>

      <div className="space-y-2 mb-4">
        {Object.entries(profiles).map(([name, desc]) => (
          <div key={name} className="flex items-start gap-2">
            <span className="text-xs font-bold text-primary-500 shrink-0 mt-0.5 uppercase">{name}</span>
            <span className="text-xs text-neutral-600">{desc}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-200 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Next game idea</p>
        <p className="text-sm font-semibold text-neutral-800">"{nextPrompt}"</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Trigger in LeaderboardCard**

In `src/app/lobby/[id]/LeaderboardCard.tsx`, if `isFinished` and lobby songs exist, add a `useMoodCard` call that hits `/api/ai/game-mood` once and renders `<MoodCard>` below the leaderboard. Pass `isBlurred={!isProUser}`.

```tsx
const [moodData, setMoodData] = useState<{ collective_mood: string; profiles: Record<string,string>; next_prompt: string } | null>(null)

useEffect(() => {
  if (!isFinished || songs.length === 0) return
  fetch("/api/ai/game-mood", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      songs: songs.map(s => ({ playerName: s.suggestedByName, trackName: s.trackName ?? s.spotifyTrackId, artist: s.artist ?? "" }))
    })
  })
    .then(r => r.ok ? r.json() : null)
    .then(data => data && setMoodData(data))
    .catch(() => null)
}, [isFinished, songs])

// In JSX, below leaderboard:
{moodData && (
  <MoodCard
    collectiveMood={moodData.collective_mood}
    profiles={moodData.profiles}
    nextPrompt={moodData.next_prompt}
    isBlurred={!isProUser}
  />
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ai/game-mood/route.ts src/components/ui/MoodCard.tsx src/app/lobby/[id]/LeaderboardCard.tsx
git commit -m "feat(mood): Post-Game Mood Card with AI analysis"
```

---

## Slice 10 — Game History + Top 5 Songs Stat

**One commit. History API, history page, Top 5 stat (Pro only).**

**Files:**
- Create: `src/app/api/user/game-history/route.ts`
- Create: `src/app/[locale]/history/page.tsx`
- Create: `src/app/[locale]/history/GameHistoryClient.tsx`

- [ ] **Step 1: History API**

Create `src/app/api/user/game-history/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { lobbies, lobbyParticipants, users, songs, ratings } from "@/lib/db/schema"
import { eq, or, desc, inArray, sql, avg, count } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", status: 401 } }, { status: 401 })

  const [dbUser] = await db
    .select({ id: users.id, proPlan: users.proPlan })
    .from(users).where(eq(users.email, user.email!)).limit(1)
  if (!dbUser) return NextResponse.json({ error: { code: "USER_NOT_FOUND", status: 404 } }, { status: 404 })

  const limit = dbUser.proPlan ? 100 : 3

  // Get all lobby IDs the user participated in
  const participations = await db
    .select({ lobbyId: lobbyParticipants.lobbyId })
    .from(lobbyParticipants)
    .where(eq(lobbyParticipants.userId, dbUser.id))

  const lobbyIds = participations.map(p => p.lobbyId)
  if (lobbyIds.length === 0) return NextResponse.json({ lobbies: [], top5: [] })

  const historyLobbies = await db
    .select()
    .from(lobbies)
    .where(inArray(lobbies.id, lobbyIds))
    .orderBy(desc(lobbies.createdAt))
    .limit(limit)

  // Top 5 most-chosen songs with avg rating (Pro only)
  let top5: any[] = []
  if (dbUser.proPlan) {
    top5 = await db
      .select({
        spotifyTrackId: songs.spotifyTrackId,
        timesChosen: count(songs.id),
        avgRating: avg(ratings.ratingValue),
        totalRatings: count(ratings.id),
      })
      .from(songs)
      .leftJoin(ratings, eq(ratings.songId, songs.id))
      .where(eq(songs.suggestedBy, dbUser.id))
      .groupBy(songs.spotifyTrackId)
      .orderBy(desc(count(songs.id)), desc(avg(ratings.ratingValue)))
      .limit(5)
  }

  return NextResponse.json({ lobbies: historyLobbies, top5, isPro: dbUser.proPlan })
}
```

- [ ] **Step 2: History page (server component)**

Create `src/app/[locale]/history/page.tsx`:

```typescript
import { Navbar } from "@/components/ui/Navbar"
import { GameHistoryClient } from "./GameHistoryClient"

export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar locale={locale} />
      <div className="max-w-container mx-auto px-6 pt-24 pb-12">
        <h1 className="font-display text-4xl font-black tracking-tight text-neutral-900 mb-8">
          Game History
        </h1>
        <GameHistoryClient locale={locale} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: GameHistoryClient**

Create `src/app/[locale]/history/GameHistoryClient.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Trophy, Music, Star, Lock } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"

export function GameHistoryClient({ locale }: { locale: string }) {
  const [data, setData] = useState<{ lobbies: any[]; top5: any[]; isPro: boolean } | null>(null)

  useEffect(() => {
    fetch("/api/user/game-history").then(r => r.json()).then(setData)
  }, [])

  if (!data) return <div className="animate-pulse h-32 bg-neutral-200 rounded-xl" />

  return (
    <div className="space-y-8">
      {/* Game list */}
      <div className="space-y-4">
        {data.lobbies.map((lobby) => (
          <MagicCard key={lobby.id} className="p-5 rounded-xl" gradientFrom="var(--color-primary-500)" gradientTo="var(--color-primary-600)" gradientSize={300}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-neutral-900">{lobby.category ?? "All categories"} · {lobby.maxRounds} rounds</p>
                <p className="text-xs text-neutral-500 mt-0.5">{new Date(lobby.createdAt).toLocaleDateString()}</p>
              </div>
              <a href={`/${locale}/lobby/${lobby.id}`} className="text-xs text-primary-500 hover:text-primary-600 font-medium">View →</a>
            </div>
          </MagicCard>
        ))}
        {!data.isPro && (
          <div className="flex items-center gap-3 p-4 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-500">
            <Lock className="size-4 shrink-0" />
            Showing last 3 games. Upgrade to Pro for full history.
          </div>
        )}
      </div>

      {/* Top 5 Songs (Pro only) */}
      {data.isPro && data.top5.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-black tracking-tight text-neutral-900 mb-4">Your Top 5 Songs</h2>
          <div className="space-y-3">
            {data.top5.map((song, i) => (
              <div key={song.spotifyTrackId} className="flex items-center gap-4 p-4 bg-neutral-100 border border-neutral-200 rounded-xl">
                <span className="font-mono text-sm text-neutral-400 w-4">{i + 1}</span>
                <Music className="size-4 text-neutral-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{song.spotifyTrackId}</p>
                  <p className="text-xs text-neutral-500">Chosen {song.timesChosen}×</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="size-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold">{song.avgRating ? Number(song.avgRating).toFixed(1) : "–"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/user/game-history/route.ts src/app/[locale]/history/page.tsx src/app/[locale]/history/GameHistoryClient.tsx
git commit -m "feat: game history page + Top 5 most-chosen songs stat (Pro)"
```

---

## Execution

```bash
/ralph-loop:ralph-loop implement all 10 slices from IMPLEMENTATIONPLAN.md [max-iterations 10]
```

Slices are independent enough that if one fails, Ralph can diagnose and continue with the next. Slice 1 (DB) must succeed before Slices 2–10. Slices 2–4 are prerequisites for 5–10 but can be verified quickly.

*Last updated: 2026-04-02*
