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
