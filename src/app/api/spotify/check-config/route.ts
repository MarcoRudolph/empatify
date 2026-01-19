import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/spotify/check-config
 * Helper endpoint to check Spotify configuration and show required Redirect URI
 * Useful for debugging and setup
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  
  const requestUrl = new URL(request.url)
  const hostHeader = request.headers.get("host")
  
  // Extract port from host header or request URL
  let port = requestUrl.port
  if (!port && hostHeader) {
    const hostPortMatch = hostHeader.match(/:(\d+)$/)
    if (hostPortMatch) {
      port = hostPortMatch[1]
    }
  }
  // Default to 3000 for development if no port found
  if (!port) {
    port = requestUrl.protocol === "https:" ? "443" : "3000"
  }
  
  let baseUrl: string
  
  // If host header contains localhost or 0.0.0.0, convert to 127.0.0.1
  if (hostHeader && (hostHeader.includes("localhost") || hostHeader.includes("0.0.0.0"))) {
    // Extract port from host header if present
    const hostPortMatch = hostHeader.match(/:(\d+)$/)
    const extractedPort = hostPortMatch ? hostPortMatch[1] : port
    baseUrl = `http://127.0.0.1:${extractedPort}`
  } else if (hostHeader && !hostHeader.includes("0.0.0.0") && !hostHeader.includes("localhost")) {
    // Use the Host header as-is for non-localhost addresses
    const protocol = requestUrl.protocol || "http:"
    baseUrl = `${protocol}//${hostHeader}`
  } else {
    // Fallback: use 127.0.0.1 with extracted port
    baseUrl = `http://127.0.0.1:${port}`
  }
  
  // Final safety check: ensure no localhost or 0.0.0.0 remains
  if (baseUrl.includes("localhost")) {
    const portMatch = baseUrl.match(/:(\d+)/)
    const finalPort = portMatch ? portMatch[1] : port
    baseUrl = `http://127.0.0.1:${finalPort}`
  }
  
  if (baseUrl.includes("0.0.0.0")) {
    const portMatch = baseUrl.match(/:(\d+)/)
    const finalPort = portMatch ? portMatch[1] : port
    baseUrl = `http://127.0.0.1:${finalPort}`
  }
  
  const redirectUri = `${baseUrl}/api/spotify/callback`
  
  // Build example authorization URL (without state) for debugging
  const exampleAuthUrl = new URL("https://accounts.spotify.com/authorize")
  if (clientId) {
    exampleAuthUrl.searchParams.set("response_type", "code")
    exampleAuthUrl.searchParams.set("client_id", clientId)
    exampleAuthUrl.searchParams.set("redirect_uri", redirectUri)
    exampleAuthUrl.searchParams.set("scope", "user-read-email user-read-private")
    exampleAuthUrl.searchParams.set("show_dialog", "false")
  }
  
  // Validation checks
  const validation = {
    clientIdValid: clientId ? clientId.length === 32 : false,
    clientSecretPresent: !!clientSecret,
    redirectUriUsesLoopback: redirectUri.includes("127.0.0.1") || redirectUri.includes("[::1]"),
    redirectUriNotLocalhost: !redirectUri.includes("localhost"),
    redirectUriFormat: redirectUri.startsWith("http://127.0.0.1:") || redirectUri.startsWith("https://"),
  }
  
  const allValid = Object.values(validation).every(v => v === true)
  
  return NextResponse.json({
    configured: {
      clientId: !!clientId,
      clientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0,
      clientIdPreview: clientId ? clientId.substring(0, 10) + "..." : null,
      clientIdFull: clientId || null, // Include full ID for verification
    },
    redirectUri,
    redirectUriEncoded: encodeURIComponent(redirectUri),
    exampleAuthUrl: clientId ? exampleAuthUrl.toString() : null,
    requestDetails: {
      hostHeader,
      requestOrigin: requestUrl.origin,
      requestUrl: requestUrl.toString(),
      baseUrl,
    },
    validation,
    allChecksPassed: allValid,
    instructions: {
      step1: "Go to https://developer.spotify.com/dashboard",
      step2: "Select your app",
      step3: "Click 'Edit Settings'",
      step4: `Add this EXACT Redirect URI: ${redirectUri}`,
      step5: "Save and try again",
      note: "The redirect URI must match EXACTLY (including http://, port number, and path)",
    },
    troubleshooting: {
      invalidClient: "If you see 'Invalid Client' or 'Insecure redirect URI' error:",
      check1: `1. Make sure Redirect URI '${redirectUri}' is EXACTLY registered in Spotify Dashboard`,
      check2: "2. IMPORTANT: Spotify no longer accepts 'localhost' - use '127.0.0.1' instead",
      check3: "3. Check that NEXT_PUBLIC_SPOTIFY_CLIENT_ID matches your Spotify App's Client ID",
      check4: "4. Verify SPOTIFY_CLIENT_SECRET is correct (it's only shown once in Spotify Dashboard)",
      check5: "5. Make sure there are no extra spaces or quotes in your .env file",
      check6: "6. Restart your dev server after changing .env variables",
      check7: "7. Check the browser console and server logs for detailed error messages",
    },
  })
}
