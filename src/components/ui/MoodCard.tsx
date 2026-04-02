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
