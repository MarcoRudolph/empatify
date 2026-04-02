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
        {data.lobbies.length === 0 && (
          <div className="flex items-center justify-center py-16 text-neutral-400">
            <p>No games yet. Create a lobby to get started!</p>
          </div>
        )}
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
