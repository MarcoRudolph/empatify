/**
 * auth-from-token.ts
 *
 * Builds auth-state.json from your existing Supabase session token.
 * No browser automation needed — bypasses Google OAuth block entirely.
 *
 * Usage:
 *   npx tsx scripts/perf/auth-from-token.ts
 *
 * Steps:
 *   1. Open https://www.empatify.de in Chrome (logged in)
 *   2. F12 → Application → Local Storage → https://www.empatify.de
 *   3. Copy the value of: sb-tbszkkguvrzigzvzjcip-auth-token
 *   4. Paste it when prompted below
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'

const AUTH_STATE_PATH = path.resolve(__dirname, 'auth-state.json')
const LS_KEY_BASE = 'sb-tbszkkguvrzigzvzjcip-auth-token'
const ORIGIN = 'https://www.empatify.de'

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function main() {
  console.log('=== Empatify auth-state builder ===\n')
  console.log('1. Open https://www.empatify.de in Chrome (make sure you are logged in)')
  console.log('2. Press F12 → Application → Local Storage → https://www.empatify.de')
  console.log(`3. Find keys: ${LS_KEY_BASE}.0 and ${LS_KEY_BASE}.1`)
  console.log('4. Copy each value when prompted\n')

  const chunk0 = await prompt(`Paste value of ${LS_KEY_BASE}.0 and press Enter:\n> `)
  const chunk1 = await prompt(`Paste value of ${LS_KEY_BASE}.1 and press Enter:\n> `)

  if (!chunk0 || !chunk1) {
    console.error('ERROR: Both chunks are required.')
    process.exit(1)
  }

  // Reassemble chunked token — Supabase stores as "base64-<b64encoded_json>"
  // The prefix only appears on chunk .0; strip it and decode the combined base64
  const combined = chunk0 + chunk1
  let raw: string
  if (combined.startsWith('base64-')) {
    raw = Buffer.from(combined.slice('base64-'.length), 'base64').toString('utf8')
  } else {
    raw = combined
  }

  // Validate it looks like a Supabase auth token
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.error('ERROR: Reassembled value is not valid JSON. Check that you pasted .0 first and .1 second.')
    console.error('First 100 chars of decoded value:', raw.slice(0, 100))
    process.exit(1)
  }

  if (!parsed.access_token) {
    console.error('ERROR: No access_token found. Make sure you are using the auth token keys, not other Supabase keys.')
    process.exit(1)
  }

  // @supabase/ssr stores the session in BOTH localStorage (browser client) and
  // cookies (server client / middleware). We need cookies for server-side auth checks.
  // Cookie format mirrors localStorage: same chunked base64 values.
  const expiresAt = (parsed.expires_at as number | undefined) ?? Math.floor(Date.now() / 1000) + 3600
  const cookieBase = {
    domain: 'www.empatify.de',
    path: '/',
    expires: expiresAt,
    httpOnly: false,
    secure: true,
    sameSite: 'Lax' as const,
  }

  const storageState = {
    cookies: [
      { name: `${LS_KEY_BASE}.0`, value: chunk0, ...cookieBase },
      { name: `${LS_KEY_BASE}.1`, value: chunk1, ...cookieBase },
    ],
    origins: [
      {
        origin: ORIGIN,
        localStorage: [
          { name: `${LS_KEY_BASE}.0`, value: chunk0 },
          { name: `${LS_KEY_BASE}.1`, value: chunk1 },
        ],
      },
    ],
  }

  fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(storageState, null, 2))
  console.log(`\nauth-state.json saved to: ${AUTH_STATE_PATH}`)

  // Show expiry if available
  const user = parsed.user as Record<string, unknown> | undefined
  const expiresAt = parsed.expires_at as number | undefined
  if (expiresAt) {
    const expiry = new Date(expiresAt * 1000)
    console.log(`Session expires: ${expiry.toLocaleString()}`)
  }
  if (user?.email) {
    console.log(`Logged in as: ${user.email}`)
  }

  console.log('\nRun npm run perf:measure to start the baseline measurement.')
}

main().catch((err) => {
  console.error('auth-from-token failed:', err)
  process.exit(1)
})
