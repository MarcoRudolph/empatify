import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    // 1. Get Client Credentials Token
    const authOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
      },
      body: "grant_type=client_credentials",
    };

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", authOptions);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error || "Failed to get Spotify token");
    }

    const accessToken = tokenData.access_token;

    // 2. Search Spotify
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      throw new Error(searchData.error?.message || "Spotify search failed");
    }

    return NextResponse.json(searchData.tracks.items);
  } catch (error: any) {
    console.error("Public search error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
