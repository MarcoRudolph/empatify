import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, lobbies, songs, ratings } from "@/lib/db/schema";
import { eq, sql, avg, desc } from "drizzle-orm";
import { createSpotifyClient } from "@/lib/spotify/client";
import { getValidSpotifyToken } from "@/lib/spotify/token";

/**
 * POST /api/spotify/playlist/create
 * Creates a Spotify playlist from a lobby's songs.
 * Pro users get all songs. Free users get Top 3.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lobbyId } = await request.json();
    if (!lobbyId) {
      return NextResponse.json({ error: "Lobby ID is required" }, { status: 400 });
    }

    // 1. Get user details (Pro status and Spotify link)
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPro = dbUser.proPlan;
    const accessToken = await getValidSpotifyToken(user.email!);

    if (!accessToken) {
      return NextResponse.json({ 
        error: "Spotify not linked", 
        code: "SPOTIFY_NOT_LINKED" 
      }, { status: 403 });
    }

    // 2. Get lobby details
    const [lobby] = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .limit(1);

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    // 3. Get songs from lobby with average ratings
    // We join songs with ratings to get the scores
    const lobbySongs = await db
      .select({
        id: songs.id,
        spotifyTrackId: songs.spotifyTrackId,
        averageRating: avg(ratings.ratingValue).mapWith(Number),
      })
      .from(songs)
      .leftJoin(ratings, eq(songs.id, ratings.songId))
      .where(eq(songs.lobbyId, lobbyId))
      .groupBy(songs.id)
      .orderBy(desc(sql`avg(${ratings.ratingValue})`));

    if (lobbySongs.length === 0) {
      return NextResponse.json({ error: "No songs found in this lobby" }, { status: 400 });
    }

    // 4. Filter songs based on Pro status
    let tracksToExport = lobbySongs;
    if (!isPro) {
      tracksToExport = lobbySongs.slice(0, 3);
    }

    const trackUris = tracksToExport.map(s => `spotify:track:${s.spotifyTrackId}`);

    // 5. Create Spotify Client
    const spotifyClient = createSpotifyClient(accessToken);

    // 6. Create the playlist
    const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const categoryName = lobby.category || "General";
    const playlistName = `Empatify: ${categoryName} Lobby (${dateStr})`;
    const description = `Created with Empatify - The Musical Empathy Game. Lobby: ${lobbyId}`;

    const createRes = await spotifyClient.createPlaylist(playlistName, {
      description,
      public: false
    });

    const playlist = createRes.body;

    // 7. Add tracks to playlist
    // Spotify API allows max 100 tracks per request, which is fine for our lobbies
    await spotifyClient.addTracksToPlaylist(playlist.id, trackUris);

    return NextResponse.json({
      success: true,
      playlistUrl: playlist.external_urls.spotify,
      playlistId: playlist.id,
      trackCount: trackUris.length,
      isPro
    });

  } catch (error: any) {
    console.error("Error creating Spotify playlist:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create playlist" 
    }, { status: 500 });
  }
}
