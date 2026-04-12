"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, Music, User, Star, Trophy, Sparkles } from "lucide-react"
import { MagicCard } from "@/components/ui/magic-card"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { DotPattern } from "@/components/ui/dot-pattern"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Persona {
  id: string
  name: string
  age: number
  description: string
  avatar: string
  color: string
}

const PERSONAS: Persona[] = [
  {
    id: "dieter",
    name: "Dieter",
    age: 40,
    description: "Living in the past. Visited Wacken Open Air 10 times. Only respects real instruments.",
    avatar: "🤘",
    color: "#444444"
  },
  {
    id: "jayden",
    name: "Jayden",
    age: 18,
    description: "Idol is Travis Scott. If it doesn't have 808s, it's not music. Lives for the rage.",
    avatar: "🌵",
    color: "#C2410C"
  },
  {
    id: "lena",
    name: "Lena",
    age: 20,
    description: "Loves whatever is top 50 in the radio. If she can dance to it, she likes it.",
    avatar: "✨",
    color: "#EC4899"
  }
]

export function EmpathyPlayground() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null)
  const [ratings, setRatings] = useState<any | null>(null)
  const [empathyScore, setEmpathyScore] = useState(0)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 3) {
        searchSpotify()
      } else {
        setResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const searchSpotify = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/spotify/search-public?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setResults(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectTrack = (track: any) => {
    setSelectedTrack(track)
    calculateRatings(track)
  }

  const calculateRatings = (track: any) => {
    const title = track.name.toLowerCase()
    const artist = track.artists[0].name.toLowerCase()
    const fullText = `${title} ${artist}`

    // Rock/Metal detection
    let dieterRating = 3
    let dieterQuote = "Is that a computer playing? No thanks."
    const rockBands = ["rock", "metal", "metallica", "ac/dc", "nirvana", "system of a down", "korn", "slipknot", "linkin park", "rammstein", "iron maiden", "black sabbath", "led zeppelin", "guns n' roses"];
    
    if (rockBands.some(band => fullText.includes(band))) {
      dieterRating = 9
      dieterQuote = "Finally! Some real instruments. 🤘"
    } else if (fullText.includes("pop") || fullText.includes("rap")) {
      dieterRating = 1
      dieterQuote = "This is what's wrong with today's music."
    }

    // Trap/Hip-Hop detection
    let jaydenRating = 2
    let jaydenQuote = "Mid. My grandma listens to this."
    const trapArtists = ["trap", "scott", "drake", "hip hop", "beat", "future", "21 savage", "metro boomin", "lil baby", "gunna", "playboi carti", "lil uzi vert", "young thug", "kendrick lamar", "kanye", "ye", "ice spice", "sexyy red", "doechii"];
    
    if (trapArtists.some(artist => fullText.includes(artist))) {
      jaydenRating = 10
      jaydenQuote = "This beat is literal fire! Straight to the playlist. 🔥"
    } else if (fullText.includes("rock") || fullText.includes("jazz") || fullText.includes("country")) {
      jaydenRating = 1
      jaydenQuote = "Boring. Where are the 808s?"
    }

    // Pop/Radio detection
    let lenaRating = 4
    let lenaQuote = "Never heard this on the radio..."
    const popArtists = ["pop", "gaga", "swift", "bieber", "charts", "dua lipa", "rihanna", "beyonce", "ariana grande", "sabrina carpenter", "the weeknd", "bruno mars", "katy perry", "ed sheeran", "harry styles", "olivia rodrigo", "billie eilish", "tate mcrae"];
    
    if (popArtists.some(artist => fullText.includes(artist))) {
      lenaRating = 9
      lenaQuote = "OMG I love this song! Let's dance! ✨"
    } else if (fullText.includes("metal") || fullText.includes("death") || fullText.includes("techno")) {
      lenaRating = 1
      lenaQuote = "Too loud, makes my head hurt."
    }

    const calculatedRatings = {
      dieter: { score: dieterRating, quote: dieterQuote },
      jayden: { score: jaydenRating, quote: jaydenQuote },
      lena: { score: lenaRating, quote: lenaQuote }
    }

    setRatings(calculatedRatings)
    const avg = (dieterRating + jaydenRating + lenaRating) / 3
    setEmpathyScore(parseFloat(avg.toFixed(1)))
  }

  const reset = () => {
    setSelectedTrack(null)
    setRatings(null)
    setQuery("")
    setResults([])
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-12 relative">
      <MagicCard
        className="p-8 rounded-3xl shadow-2xl border-neutral-800 bg-neutral-900/50 backdrop-blur-xl overflow-visible"
        gradientFrom="#FF6B00"
        gradientTo="#FF9D00"
        gradientSize={800}
      >
        <DotPattern className="opacity-20" />
        
        <div className="relative z-10">
          {!selectedTrack ? (
            <>
              <div className="text-center mb-8">
                <span className="inline-block px-3 py-1 bg-primary-500/10 text-primary-500 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                  Empathy Test
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                  Can you read the room?
                </h2>
                <p className="text-neutral-400 text-lg max-w-xl mx-auto mb-8">
                  Pick a song from Spotify that these three would all enjoy. High empathy wins.
                </p>
              </div>

              {/* Search Section - Moved Higher & More Prominent */}
              <div className="relative max-w-xl mx-auto mb-12">
                <div className="relative group scale-105 md:scale-110">
                  <div className="absolute inset-0 bg-primary-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-6 text-white/70 group-focus-within:text-white transition-colors z-10" />
                  <input
                    type="text"
                    placeholder="Type a song or artist..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-primary-500 border-2 border-primary-400/50 rounded-2xl py-5 pl-14 pr-4 text-white placeholder:text-white/60 focus:outline-none focus:border-white focus:ring-4 focus:ring-primary-500/20 transition-all shadow-xl font-bold text-lg relative z-0"
                  />
                  {isLoading && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 size-6 text-white animate-spin z-10" />
                  )}
                </div>

                {/* Search Results - No Clipping */}
                {results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-neutral-900 border-2 border-neutral-800 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {results.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => handleSelectTrack(track)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-primary-500/10 transition-colors text-left group border-b border-neutral-800 last:border-0"
                      >
                        <img src={track.album.images[track.album.images.length - 1]?.url} className="size-12 rounded shadow-lg" alt="" />
                        <div className="flex-1 truncate">
                          <p className="text-white font-bold truncate group-hover:text-primary-500 transition-colors">{track.name}</p>
                          <p className="text-neutral-500 text-sm truncate">{track.artists.map((a: any) => a.name).join(", ")}</p>
                        </div>
                        <Music className="size-5 text-neutral-700 group-hover:text-primary-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Persona Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PERSONAS.map((p) => (
                  <div key={p.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center backdrop-blur-sm">
                    <span className="text-4xl mb-3">{p.avatar}</span>
                    <h3 className="text-white font-bold">{p.name}, {p.age}</h3>
                    <p className="text-[10px] text-neutral-500 mt-2 uppercase font-black tracking-widest">{p.description}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                <img src={selectedTrack.album.images[0]?.url} className="size-48 rounded-3xl shadow-2xl border-2 border-white/10" alt="" />
                <div className="text-center md:text-left">
                  <h3 className="text-4xl font-black text-white leading-tight mb-2" style={{ fontFamily: 'Unbounded, sans-serif' }}>{selectedTrack.name}</h3>
                  <p className="text-xl text-primary-500 font-bold">{selectedTrack.artists.map((a: any) => a.name).join(", ")}</p>
                  
                  <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-center">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">Average Empathy</p>
                      <p className="text-3xl font-black text-white italic">{empathyScore}/10</p>
                    </div>
                    {empathyScore >= 8 && (
                      <div className="bg-primary-500 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-primary-500/30">
                        <Trophy className="size-8" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-tighter">New Badge</p>
                          <p className="font-bold">Natural Empath</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {PERSONAS.map((p) => (
                  <div key={p.id} className="relative group">
                    <div className="absolute inset-0 bg-primary-500/5 rounded-2xl blur-xl group-hover:bg-primary-500/10 transition-all"></div>
                    <div className="relative bg-neutral-950/50 border border-white/10 p-6 rounded-2xl h-full flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-3xl">{p.avatar}</span>
                          <div className="flex gap-0.5">
                            {[...Array(10)].map((_, i) => (
                              <div 
                                key={i} 
                                className={cn(
                                  "w-1 h-4 rounded-full",
                                  i < ratings[p.id].score ? "bg-primary-500" : "bg-neutral-800"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-white font-bold mb-1">{p.name}</p>
                        <p className="text-neutral-500 text-sm leading-relaxed italic">"{ratings[p.id].quote}"</p>
                      </div>
                      <p className="mt-4 text-2xl font-black text-white">{ratings[p.id].score}/10</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="text-center">
                  <p className="text-neutral-400 mb-6 text-lg">Think you can read your real friends? Give it a shot.</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <ShimmerButton
                      onClick={reset}
                      background="rgba(255,255,255,0.05)"
                      shimmerColor="#ffffff"
                      borderRadius="9999px"
                      className="px-8 h-14 border border-white/10 font-bold"
                    >
                      Try Another Song
                    </ShimmerButton>
                    <Link href="/">
                      <ShimmerButton
                        background="#FF6B00"
                        shimmerColor="#ffffff"
                        borderRadius="9999px"
                        className="px-10 h-14 font-black shadow-[0_0_30px_rgba(255,107,0,0.5)]"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="size-5" />
                          Start Real Game
                        </span>
                      </ShimmerButton>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </MagicCard>
    </div>
  )
}
