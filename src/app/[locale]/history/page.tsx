import { Navbar } from "@/components/ui/Navbar"
import { GameHistoryClient } from "./GameHistoryClient"

export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar locale={locale} />
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-12">
        <h1 className="font-display text-4xl font-black tracking-tight text-neutral-900 mb-8">
          Game History
        </h1>
        <GameHistoryClient locale={locale} />
      </div>
    </div>
  )
}
