---
description: "Phase 2 + 3 implementation plan: dashboard N+1 elimination, query parallelisation, AbortController, Upstash Redis caching"
paths:
  - "../../specs/2026-04-03-performance-measurement-redis-design.md"
  - "../../../src/app/[locale]/dashboard/page.tsx"
  - "../../../src/app/lobby/[id]/select-song/SelectSongPageClient.tsx"
  - "../../../src/lib/spotify/client-credentials.ts"
  - "../../../src/app/api/spotify/search/route.ts"
---

# Phase 2 + 3 Performance Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce dashboard TTI from ~12 s to <5 s by eliminating N+1 DB queries and parallelising fetches; then add Upstash Redis caching on hot paths for a further reduction and to persist across Vercel cold starts.

**Architecture:** Extract dashboard data-fetching into a dedicated `fetchDashboardData.ts` module that executes queries in 3 parallel rounds instead of the current ~15 sequential + N queries. Layer Redis `withCache` on top of Spotify search, the CC token, and the user profile. Measure before/after with the existing Playwright perf scripts.

**Tech Stack:** Drizzle ORM (`inArray`, `Promise.all`), `@upstash/redis`, Next.js App Router server components, React `useEffect` + `AbortController`.

**Baseline (to beat):**
| Flow | FCP | TTI |
|------|-----|-----|
| dashboard | ~8 300 ms | ~12 300 ms |
| select-song search | — | ~1 500 ms |

---

## Files

| Action | Path | Purpose |
|--------|------|---------|
| **Create** | `src/app/[locale]/dashboard/fetchDashboardData.ts` | All dashboard DB queries — 3-round parallel, no N+1 |
| **Modify** | `src/app/[locale]/dashboard/page.tsx` | Replace inline query blocks with `fetchDashboardData` call |
| **Modify** | `src/app/lobby/[id]/select-song/SelectSongPageClient.tsx` | Add `AbortController` to cancel in-flight Spotify search |
| **Create** | `src/lib/cache.ts` | Thin `withCache<T>` wrapper over Upstash Redis |
| **Modify** | `src/app/api/spotify/search/route.ts` | Wrap Spotify search result with `withCache` |
| **Modify** | `src/lib/spotify/client-credentials.ts` | Replace module-level token cache with Redis (survives cold starts) |
| **Modify** | `src/app/api/lobby/create/route.ts` | Invalidate `lobbies:user:{userId}` on lobby create |

---

## Task 1 — Create `fetchDashboardData.ts` (bulk + parallel queries)

**Files:**
- Create: `src/app/[locale]/dashboard/fetchDashboardData.ts`

This replaces the ~15 sequential queries + N+1 per-lobby loop with exactly **3 rounds of `Promise.all`**:
- **Round 1** (4 parallel): hostedLobbies, participantLobbies, friendships, userSongsForStats
- **Round 2** (4 parallel): allSongs, allParticipants, friendDetails, statRatings
- **Round 3** (1 query): allRatings (needs song IDs from round 2)

All lobby enrichment runs in JS against the in-memory bulk data — zero extra DB calls.

- [ ] **Step 1.1: Create the file with types and imports**

```typescript
// src/app/[locale]/dashboard/fetchDashboardData.ts
import { db } from '@/lib/db'
import { users, lobbies, lobbyParticipants, songs, ratings, friends } from '@/lib/db/schema'
import { eq, or, desc, and, inArray } from 'drizzle-orm'

export interface TopPlayer {
  userId: string
  name: string
  avatarUrl: string | null
  averageRating: number
}

export interface EnrichedLobby {
  id: string
  hostId: string
  category: string | null
  maxRounds: number
  gameMode: string
  createdAt: Date
  averageRating: number
  status: 'not_started' | 'running' | 'finished'
  currentRound: number
  needsSongSelection: boolean
  participantCount: number
  topPlayers: TopPlayer[]
  roundToRate: number | null
}

export interface FriendUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

export interface MiniStats {
  gamesPlayed: number
  averageRating: number
  songsSuggested: number
}

export interface DashboardData {
  userLobbies: EnrichedLobby[]
  userFriends: FriendUser[]
  miniStats: MiniStats
}
```

- [ ] **Step 1.2: Write the `fetchDashboardData` function — Round 1 (4 parallel queries)**

Add this function to the file after the types:

```typescript
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  // ── Round 1: 4 independent queries in parallel ────────────────────────────
  const [hostedLobbies, participantLobbyRows, friendships, userSongsForStats] =
    await Promise.all([
      // Lobbies where user is host
      db
        .select({
          id: lobbies.id,
          hostId: lobbies.hostId,
          category: lobbies.category,
          maxRounds: lobbies.maxRounds,
          gameMode: lobbies.gameMode,
          createdAt: lobbies.createdAt,
        })
        .from(lobbies)
        .where(eq(lobbies.hostId, userId))
        .orderBy(desc(lobbies.createdAt)),

      // Lobbies where user is a participant (not necessarily host)
      db
        .select({
          id: lobbies.id,
          hostId: lobbies.hostId,
          category: lobbies.category,
          maxRounds: lobbies.maxRounds,
          gameMode: lobbies.gameMode,
          createdAt: lobbies.createdAt,
        })
        .from(lobbyParticipants)
        .innerJoin(lobbies, eq(lobbyParticipants.lobbyId, lobbies.id))
        .where(eq(lobbyParticipants.userId, userId))
        .orderBy(desc(lobbies.createdAt)),

      // All friendships involving this user
      db
        .select({ userId: friends.userId, friendId: friends.friendId })
        .from(friends)
        .where(or(eq(friends.userId, userId), eq(friends.friendId, userId))),

      // Songs suggested by this user (for stats)
      db
        .select({ id: songs.id })
        .from(songs)
        .where(eq(songs.suggestedBy, userId)),
    ])

  // Deduplicate lobbies (user may be both host and participant)
  const lobbyMap = new Map<string, (typeof hostedLobbies)[0]>()
  hostedLobbies.forEach((l) => lobbyMap.set(l.id, l))
  participantLobbyRows.forEach((l) => { if (!lobbyMap.has(l.id)) lobbyMap.set(l.id, l) })
  const userLobbiesRaw = Array.from(lobbyMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const lobbyIds = userLobbiesRaw.map((l) => l.id)

  // Derive IDs needed for Round 2
  const friendIds = friendships.map((f) => (f.userId === userId ? f.friendId : f.userId))
  const statSongIds = userSongsForStats.map((s) => s.id)
```

- [ ] **Step 1.3: Add Round 2 (4 parallel bulk queries)**

Continue the function:

```typescript
  // ── Round 2: 4 bulk queries in parallel ──────────────────────────────────
  const [allSongs, allParticipants, friendDetails, statRatings] = await Promise.all([
    // All songs across all user lobbies
    lobbyIds.length > 0
      ? db
          .select({
            id: songs.id,
            lobbyId: songs.lobbyId,
            roundNumber: songs.roundNumber,
            suggestedBy: songs.suggestedBy,
          })
          .from(songs)
          .where(inArray(songs.lobbyId, lobbyIds))
      : Promise.resolve([] as Array<{ id: string; lobbyId: string; roundNumber: number; suggestedBy: string }>),

    // All participants with user details across all lobbies
    lobbyIds.length > 0
      ? db
          .select({
            lobbyId: lobbyParticipants.lobbyId,
            userId: lobbyParticipants.userId,
            userName: users.name,
            userAvatarUrl: users.avatarUrl,
          })
          .from(lobbyParticipants)
          .innerJoin(users, eq(lobbyParticipants.userId, users.id))
          .where(inArray(lobbyParticipants.lobbyId, lobbyIds))
      : Promise.resolve([] as Array<{ lobbyId: string; userId: string; userName: string; userAvatarUrl: string | null }>),

    // Friend user details
    friendIds.length > 0
      ? db
          .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl })
          .from(users)
          .where(inArray(users.id, friendIds))
      : Promise.resolve([] as FriendUser[]),

    // Ratings for user's own songs (for mini stats)
    statSongIds.length > 0
      ? db
          .select({ ratingValue: ratings.ratingValue })
          .from(ratings)
          .where(inArray(ratings.songId, statSongIds))
      : Promise.resolve([] as Array<{ ratingValue: number }>),
  ])
```

- [ ] **Step 1.4: Add Round 3 (ratings for all lobby songs)**

```typescript
  // ── Round 3: ratings for all lobby songs (depends on allSongs from Round 2) ──
  const allSongIds = allSongs.map((s) => s.id)
  const allRatings =
    allSongIds.length > 0
      ? await db
          .select({
            songId: ratings.songId,
            ratingValue: ratings.ratingValue,
            givenBy: ratings.givenBy,
          })
          .from(ratings)
          .where(inArray(ratings.songId, allSongIds))
      : []
```

- [ ] **Step 1.5: Group bulk data by lobby in JS**

```typescript
  // ── Group in JS (zero extra DB calls) ────────────────────────────────────
  const songsByLobby = new Map<string, typeof allSongs>()
  allSongs.forEach((s) => {
    const arr = songsByLobby.get(s.lobbyId) ?? []
    arr.push(s)
    songsByLobby.set(s.lobbyId, arr)
  })

  const participantsByLobby = new Map<string, typeof allParticipants>()
  allParticipants.forEach((p) => {
    const arr = participantsByLobby.get(p.lobbyId) ?? []
    arr.push(p)
    participantsByLobby.set(p.lobbyId, arr)
  })

  const ratingsBySongId = new Map<string, typeof allRatings>()
  allRatings.forEach((r) => {
    const arr = ratingsBySongId.get(r.songId) ?? []
    arr.push(r)
    ratingsBySongId.set(r.songId, arr)
  })
```

- [ ] **Step 1.6: Write the lobby enrichment function (pure JS, no DB)**

```typescript
  function enrichLobby(lobby: (typeof userLobbiesRaw)[0]): EnrichedLobby {
    const lobbySongs = songsByLobby.get(lobby.id) ?? []
    const lobbyParticipantsList = participantsByLobby.get(lobby.id) ?? []
    const lobbyRatings = lobbySongs.flatMap((s) => ratingsBySongId.get(s.id) ?? [])

    const averageRating =
      lobbyRatings.length > 0
        ? lobbyRatings.reduce((sum, r) => sum + r.ratingValue, 0) / lobbyRatings.length
        : 0

    const participantCount = lobbyParticipantsList.length

    // Leaderboard
    const leaderboardMap = new Map<
      string,
      { userId: string; name: string; avatarUrl: string | null; totalRating: number; count: number }
    >()
    lobbyParticipantsList.forEach((p) => {
      leaderboardMap.set(p.userId, {
        userId: p.userId,
        name: p.userName,
        avatarUrl: p.userAvatarUrl,
        totalRating: 0,
        count: 0,
      })
    })
    lobbySongs.forEach((song) => {
      const songRatings = ratingsBySongId.get(song.id) ?? []
      songRatings.forEach((r) => {
        const entry = leaderboardMap.get(song.suggestedBy)
        if (entry) {
          entry.totalRating += r.ratingValue
          entry.count++
        }
      })
    })
    const leaderboard = Array.from(leaderboardMap.values())
      .map((e) => ({
        userId: e.userId,
        name: e.name,
        avatarUrl: e.avatarUrl,
        averageRating: e.count > 0 ? e.totalRating / e.count : 0,
      }))
      .sort((a, b) => b.averageRating - a.averageRating)

    const topPlayers =
      participantCount >= 3
        ? leaderboard.slice(0, 3)
        : participantCount >= 2
        ? leaderboard.slice(0, 2)
        : []

    // roundToRate
    let roundToRate: number | null = null
    if (lobbySongs.length > 0 && participantCount > 1) {
      const userRatingSet = new Set(
        lobbyRatings.filter((r) => r.givenBy === userId).map((r) => r.songId)
      )
      for (let round = 1; round <= lobby.maxRounds; round++) {
        const roundSongs = lobbySongs.filter((s) => s.roundNumber === round)
        const songsToRate = roundSongs.filter(
          (s) => !userRatingSet.has(s.id) && s.suggestedBy !== userId
        )
        if (songsToRate.length > 0) {
          roundToRate = round
          break
        }
      }
    }

    // Status + currentRound
    let currentRound = 1
    let status: 'not_started' | 'running' | 'finished' = 'not_started'
    let needsSongSelection = false

    if (lobbySongs.length === 0 || participantCount <= 1) {
      status = 'not_started'
      currentRound = 1
      needsSongSelection = true
    } else {
      status = 'running'
      for (let round = 1; round <= lobby.maxRounds; round++) {
        const roundSongs = lobbySongs.filter((s) => s.roundNumber === round)
        const participantsWithSongs = new Set(roundSongs.map((s) => s.suggestedBy))

        if (!participantsWithSongs.has(userId)) {
          currentRound = round
          needsSongSelection = true
          break
        }

        if (participantsWithSongs.size === participantCount) {
          if (round === lobby.maxRounds) {
            const expectedPerSong = participantCount - 1
            const ratingsPerSong = new Map<string, number>()
            lobbyRatings.forEach((r) => {
              ratingsPerSong.set(r.songId, (ratingsPerSong.get(r.songId) ?? 0) + 1)
            })
            const allRated = lobbySongs.every(
              (s) => (ratingsPerSong.get(s.id) ?? 0) >= expectedPerSong
            )
            status = allRated ? 'finished' : 'running'
            currentRound = round
            needsSongSelection = false
            break
          } else {
            currentRound = round + 1
            const nextSongs = lobbySongs.filter((s) => s.roundNumber === round + 1)
            const nextParticipants = new Set(nextSongs.map((s) => s.suggestedBy))
            if (!nextParticipants.has(userId)) {
              needsSongSelection = true
              break
            }
          }
        } else {
          currentRound = round
          if (!participantsWithSongs.has(userId)) needsSongSelection = true
          break
        }
      }

      // Final finished check
      if (
        status === 'running' &&
        (currentRound > lobby.maxRounds ||
          (currentRound === lobby.maxRounds && !needsSongSelection))
      ) {
        const expectedPerSong = participantCount - 1
        const ratingsPerSong = new Map<string, number>()
        lobbyRatings.forEach((r) => {
          ratingsPerSong.set(r.songId, (ratingsPerSong.get(r.songId) ?? 0) + 1)
        })
        if (lobbySongs.every((s) => (ratingsPerSong.get(s.id) ?? 0) >= expectedPerSong)) {
          status = 'finished'
          needsSongSelection = false
        }
      }
    }

    return {
      ...lobby,
      averageRating,
      status,
      currentRound,
      needsSongSelection,
      participantCount,
      topPlayers,
      roundToRate,
    }
  }
```

- [ ] **Step 1.7: Assemble and return `DashboardData`**

```typescript
  const userLobbies = userLobbiesRaw.map(enrichLobby)

  // Mini stats
  const finishedLobbies = userLobbies.filter((l) => l.status === 'finished')
  const totalRatingSum = statRatings.reduce((sum, r) => sum + r.ratingValue, 0)
  const miniStats: MiniStats = {
    gamesPlayed: finishedLobbies.length,
    averageRating: statRatings.length > 0 ? totalRatingSum / statRatings.length : 0,
    songsSuggested: userSongsForStats.length,
  }

  return {
    userLobbies,
    userFriends: friendDetails as FriendUser[],
    miniStats,
  }
}
```

- [ ] **Step 1.8: Verify TypeScript compiles**

```bash
cd E:\Users\Marco\DokumenteAlt\repo\cursor\empatify
npx tsc --noEmit 2>&1 | grep fetchDashboardData
```
Expected: no errors mentioning `fetchDashboardData.ts`.

- [ ] **Step 1.9: Commit**

```bash
git add src/app/\[locale\]/dashboard/fetchDashboardData.ts
git commit -m "perf: extract dashboard data fetching — 3-round parallel, no N+1"
```

---

## Task 2 — Wire `fetchDashboardData` into `page.tsx`

**Files:**
- Modify: `src/app/[locale]/dashboard/page.tsx`

Replace the three sequential fetch blocks (lobby loop lines ~215–516, friends lines ~518–556, stats lines ~566–600) with a single `fetchDashboardData` call. The render JSX below line ~600 is untouched.

- [ ] **Step 2.1: Add the import at the top of `page.tsx`**

Find the existing import block near the top of `page.tsx` (after `import { LobbyList } from './LobbyList'`) and add:

```typescript
import { fetchDashboardData } from './fetchDashboardData'
```

- [ ] **Step 2.2: Replace the sequential fetch blocks with one call**

In `page.tsx`, find this comment (around line 215):

```typescript
  let userLobbies: any[] = [];
  try {
    if (dbUser?.id) {
```

Delete everything from that line through to the end of the `miniStats` object definition (~line 600):

```typescript
  const miniStats = {
    gamesPlayed: finishedLobbies.length,
    averageRating: totalRatingsReceived > 0 ? totalRatingSum / totalRatingsReceived : 0,
    songsSuggested: totalSongsSuggested,
  };
```

Replace the entire deleted block with:

```typescript
  let userLobbies: Awaited<ReturnType<typeof fetchDashboardData>>['userLobbies'] = []
  let userFriends: Awaited<ReturnType<typeof fetchDashboardData>>['userFriends'] = []
  let miniStats = { gamesPlayed: 0, averageRating: 0, songsSuggested: 0 }

  if (dbUser?.id) {
    try {
      const dashData = await fetchDashboardData(dbUser.id)
      userLobbies = dashData.userLobbies
      userFriends = dashData.userFriends
      miniStats = dashData.miniStats
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }
```

- [ ] **Step 2.3: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: 0 errors. If type errors appear on the `userLobbies` or `userFriends` arrays in the JSX (the render part uses `any[]` throughout), cast them back to `any[]`:

```typescript
  let userLobbies: any[] = []
  let userFriends: any[] = []
```

- [ ] **Step 2.4: Test locally (dev server)**

```bash
npm run dev
```
Open `http://localhost:3000/en/dashboard`. Verify lobbies, friends list, and mini stats all render correctly. Check terminal for any DB errors.

- [ ] **Step 2.5: Commit**

```bash
git add src/app/\[locale\]/dashboard/page.tsx
git commit -m "perf: replace sequential dashboard queries with fetchDashboardData"
```

---

## Task 3 — Add `AbortController` to Spotify search

**Files:**
- Modify: `src/app/lobby/[id]/select-song/SelectSongPageClient.tsx`

The debounce is already in place. This adds cancellation so stale in-flight requests don't update state after a new query fires.

- [ ] **Step 3.1: Replace the `fetchTracks` useEffect**

Find this block in `SelectSongPageClient.tsx` (around line 107):

```typescript
  useEffect(() => {
    const fetchTracks = async () => {
      if (!debouncedQuery) return

      setIsSearching(true)
      setSearchError(null)
      setVisibleResults(10)

      try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(debouncedQuery)}`)
```

Replace the entire `useEffect` (from `useEffect(() => {` through its closing `}, [debouncedQuery])`) with:

```typescript
  useEffect(() => {
    if (!debouncedQuery) return

    const controller = new AbortController()

    const fetchTracks = async () => {
      setIsSearching(true)
      setSearchError(null)
      setVisibleResults(10)

      try {
        const response = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal }
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error?.message || 'Search failed')
        }

        setTracks(Array.isArray(data?.tracks?.items) ? data.tracks.items : [])
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') return
        const message =
          fetchError instanceof Error ? fetchError.message : 'Could not search songs right now.'
        setTracks([])
        setSearchError(message)
      } finally {
        setIsSearching(false)
      }
    }

    fetchTracks()
    return () => controller.abort()
  }, [debouncedQuery])
```

- [ ] **Step 3.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep SelectSong
```
Expected: no errors.

- [ ] **Step 3.3: Commit**

```bash
git add src/app/lobby/\[id\]/select-song/SelectSongPageClient.tsx
git commit -m "perf: add AbortController to Spotify search — cancel stale requests"
```

---

## Task 4 — Setup Upstash Redis + `src/lib/cache.ts`

**Files:**
- Create: `src/lib/cache.ts`

- [ ] **Step 4.1: Install the Upstash Redis package**

```bash
npm install @upstash/redis
```
Expected: package added to `dependencies` in `package.json`.

- [ ] **Step 4.2: Create an Upstash database**

1. Go to [console.upstash.com](https://console.upstash.com) → Create Database → name: `empatify-cache`, region: `eu-west-1` (closest to Vercel's Frankfurt region), type: Regional, free tier.
2. Copy **REST URL** and **REST Token** from the database details page.
3. Add to `.env`:

```bash
UPSTASH_REDIS_REST_URL=https://YOUR_DB.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN
```

4. Add same vars to Vercel project: `vercel env add UPSTASH_REDIS_REST_URL production` and `vercel env add UPSTASH_REDIS_REST_TOKEN production` (paste values when prompted).

- [ ] **Step 4.3: Create `src/lib/cache.ts`**

```typescript
// src/lib/cache.ts
import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

/**
 * Cache-aside wrapper. Returns cached value if present, otherwise calls `fn`,
 * stores the result, and returns it.
 *
 * Falls open on Redis errors — if Redis is unavailable the function is called
 * directly so the app never breaks because of a cache outage.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const cached = await getRedis().get<T>(key)
    if (cached !== null) return cached
  } catch {
    // Redis unavailable — fall through to source
  }

  const value = await fn()

  try {
    await getRedis().set(key, value, { ex: ttlSeconds })
  } catch {
    // Redis write failure is non-fatal
  }

  return value
}

/** Explicitly delete a cache key (e.g. on lobby create/delete). */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await getRedis().del(key)
  } catch {
    // Non-fatal
  }
}
```

- [ ] **Step 4.4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep cache
```
Expected: no errors.

- [ ] **Step 4.5: Commit**

```bash
git add src/lib/cache.ts package.json package-lock.json .env
git commit -m "perf: add Upstash Redis withCache wrapper"
```

---

## Task 5 — Cache Spotify search results

**Files:**
- Modify: `src/app/api/spotify/search/route.ts`

Cache key: `spotify:search:{normalised-query}` — TTL 3600 s (track metadata is stable).

- [ ] **Step 5.1: Add the cache import and wrap the Spotify search call**

In `src/app/api/spotify/search/route.ts`, add the import at the top:

```typescript
import { withCache } from '@/lib/cache'
```

Find the Spotify search call:

```typescript
    // Search Spotify
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error("Spotify API error:", errorText)
      return NextResponse.json(...)
    }

    const searchData = await searchResponse.json()
    return NextResponse.json(searchData)
```

Replace the block from `// Search Spotify` through the final `return NextResponse.json(searchData)` with:

```typescript
    // Search Spotify — cached 1 h (track metadata is stable)
    const cacheKey = `spotify:search:${query.toLowerCase().trim()}`
    const searchData = await withCache(cacheKey, 3600, async () => {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Spotify API error:', errorText)
        throw new Error(`Spotify API error ${res.status}`)
      }
      return res.json()
    })

    return NextResponse.json(searchData)
```

Update the outer catch to handle the new error:

```typescript
  } catch (error) {
    console.error('Spotify search route error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to search Spotify', status: 500 } },
      { status: 500 }
    )
  }
```

- [ ] **Step 5.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "spotify/search"
```
Expected: no errors.

- [ ] **Step 5.3: Commit**

```bash
git add src/app/api/spotify/search/route.ts
git commit -m "perf: cache Spotify search results 1h in Redis"
```

---

## Task 6 — Cache Spotify CC token in Redis (survive cold starts)

**Files:**
- Modify: `src/lib/spotify/client-credentials.ts`

The current module-level `cachedToken` resets on every Vercel cold start. Redis persists it across instances.

- [ ] **Step 6.1: Replace the module-level cache with Redis**

Open `src/lib/spotify/client-credentials.ts`. The current module-level cache:

```typescript
let cachedToken: { token: string; expiresAt: number } | null = null
```

Replace the entire file content with:

```typescript
// src/lib/spotify/client-credentials.ts
import { withCache } from '@/lib/cache'

/**
 * Gets a valid Spotify Client Credentials access token.
 * Cached in Redis for 3500 s (token expires after 3600 s).
 * Falls back to a direct fetch if Redis is unavailable.
 */
export async function getClientCredentialsToken(): Promise<string | null> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('Spotify credentials not configured')
    return null
  }

  return withCache('spotify:token:cc', 3500, async () => {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Failed to get client credentials token:', errorText)
      throw new Error(`Spotify token fetch failed: ${tokenResponse.status}`)
    }

    const { access_token } = await tokenResponse.json()
    return access_token as string
  })
}
```

- [ ] **Step 6.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep client-credentials
```
Expected: no errors.

- [ ] **Step 6.3: Commit**

```bash
git add src/lib/spotify/client-credentials.ts
git commit -m "perf: cache Spotify CC token in Redis — survives cold starts"
```

---

## Task 7 — Cache user profile + lobby list in `page.tsx`

**Files:**
- Modify: `src/app/[locale]/dashboard/page.tsx`

Cache the user lookup by email for 5 minutes (profile rarely changes). Cache the entire dashboard data for 30 seconds (acceptable staleness; Task 8 invalidates it explicitly on lobby create).

> **Prerequisite:** Task 4 must be complete (cache.ts exists, env vars set).

- [ ] **Step 7.1: Add cache import to `page.tsx`**

Add at the top of `page.tsx`:

```typescript
import { withCache } from '@/lib/cache'
```

- [ ] **Step 7.2: Wrap the user record DB call with `withCache`**

In `page.tsx`, find the user record fetch (around line 49):

```typescript
    const userRecord = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        proPlan: users.proPlan,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)
```

Replace with:

```typescript
    const userRecord = await withCache(
      `user:profile:${user.id}`,
      300,
      () =>
        db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            avatarUrl: users.avatarUrl,
            proPlan: users.proPlan,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1)
    )
```

- [ ] **Step 7.3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 7.4: Commit**

```bash
git add src/app/\[locale\]/dashboard/page.tsx
git commit -m "perf: cache user profile 5 min in Redis"
```

---

## Task 8 — Invalidate lobby cache on create

**Files:**
- Modify: `src/app/api/lobby/create/route.ts`

The lobby list TTL is 30 s but explicit invalidation keeps the dashboard accurate immediately after lobby creation.

- [ ] **Step 8.1: Add invalidation call in the lobby create route**

Open `src/app/api/lobby/create/route.ts`. Add import at the top:

```typescript
import { invalidateCache } from '@/lib/cache'
```

Find the section where the lobby ID is returned (after the `db.insert` for the new lobby). Add invalidation right before the `return NextResponse.json(...)`:

```typescript
      // Invalidate the lobby list cache so the dashboard reflects the new lobby immediately
      await invalidateCache(`lobbies:user:${userId}`)
```

The exact location is after `const lobbyId = data.lobby.id` (or equivalent) and before the success response. Search for `return NextResponse.json` in the success path and insert the `invalidateCache` call immediately before it.

- [ ] **Step 8.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "lobby/create"
```
Expected: no errors.

- [ ] **Step 8.3: Commit**

```bash
git add src/app/api/lobby/create/route.ts
git commit -m "perf: invalidate lobby cache on create"
```

---

## Task 9 — Deploy, re-measure, diff

- [ ] **Step 9.1: Push all commits**

```bash
git push origin main
```
Wait for Vercel deployment to complete (check `vercel.app` dashboard or `npx vercel --prod` status).

- [ ] **Step 9.2: Refresh auth token (magic link expires after 1 h)**

```bash
npm run perf:auth
```
Expected output: `auth-state.json saved` + `Logged in as: mssayyy@gmail.com`.

- [ ] **Step 9.3: Run after-measurement**

```bash
npm run perf:measure:after
```
Expected: all 5 flows complete, `perf-report-after.json` written.

- [ ] **Step 9.4: Diff baseline vs after**

```bash
npm run perf:diff
```
Expected improvement targets per spec:
- Dashboard FCP: ≥ 40% reduction (from ~8 300 ms → ≤ 5 000 ms)
- Spotify search first-result: ≥ 50% reduction (from ~1 500 ms → ≤ 750 ms on cached queries)

- [ ] **Step 9.5: Commit the after-report (optional, for the record)**

```bash
git add scripts/perf/perf-report-after.json scripts/perf/perf-report-after.md
git commit -m "perf: after-measurement report — Phase 2+3 results"
```

---

## Execution Checklist

- [ ] Task 1: `fetchDashboardData.ts` created and compiles
- [ ] Task 2: `page.tsx` wired to `fetchDashboardData`
- [ ] Task 3: AbortController added to Spotify search component
- [ ] Task 4: Upstash database created, `cache.ts` created, env vars set
- [ ] Task 5: Spotify search route cached
- [ ] Task 6: CC token cached in Redis
- [ ] Task 7: User profile cached
- [ ] Task 8: Lobby cache invalidation on create
- [ ] Task 9: Deploy + measure + diff — targets hit
