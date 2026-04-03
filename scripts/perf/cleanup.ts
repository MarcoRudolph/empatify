/**
 * cleanup.ts — Delete test lobbies created during measurement runs
 *
 * Calls Supabase REST API directly with the service role key.
 * Requires TEST_USER_ID and SUPABASE_SERVICE_KEY in .env (or .env.local).
 *
 * Can also be run standalone: npx tsx scripts/perf/cleanup.ts [lobbyId1] [lobbyId2] ...
 */

import 'dotenv/config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

export async function cleanupTestLobbies(lobbyIds: string[]): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.warn(
      'WARN: SUPABASE_SERVICE_KEY not set — skipping cleanup. Add to .env to enable automatic cleanup.'
    )
    console.warn('Lobbies to clean up manually:', lobbyIds)
    return
  }

  if (lobbyIds.length === 0) {
    console.log('Cleanup: no lobbies to delete.')
    return
  }

  console.log(`\nCleaning up ${lobbyIds.length} test lobby/lobbies: ${lobbyIds.join(', ')}`)

  for (const id of lobbyIds) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/lobbies?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
      })

      if (res.ok) {
        console.log(`  Deleted lobby: ${id}`)
      } else {
        const body = await res.text()
        console.warn(`  Failed to delete lobby ${id}: ${res.status} ${body}`)
      }
    } catch (err) {
      console.warn(`  Error deleting lobby ${id}:`, err)
    }
  }
}

// Standalone usage
if (process.argv[2] && process.argv[2] !== '--') {
  const ids = process.argv.slice(2)
  cleanupTestLobbies(ids).catch((err) => {
    console.error('cleanup failed:', err)
    process.exit(1)
  })
}
