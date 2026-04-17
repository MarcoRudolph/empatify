import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getTranslations } from "next-intl/server"
import { ShareSoulEntry } from "./ShareSoulEntry"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://empatify.de"

async function loadUserByHandle(handle: string) {
  const decoded = decodeURIComponent(handle)
  const row = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      proPlan: users.proPlan,
      totalGamesPlayed: users.totalGamesPlayed,
      averageRatingReceived: users.averageRatingReceived,
      topSongs: users.topSongs,
    })
    .from(users)
    .where(eq(users.name, decoded))
    .limit(1)
  return row[0] ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>
}): Promise<Metadata> {
  const { locale, handle } = await params
  const user = await loadUserByHandle(handle)
  const t = await getTranslations({ locale, namespace: "viralCard" })

  const displayName = user?.name ?? handle
  const titleTag = `${displayName} — ${t("title")}`
  const description = user
    ? `${displayName} has an Empathy score of ${user.averageRatingReceived} across ${user.totalGamesPlayed} games. Can you match their musical taste on Empatify?`
    : "Pick songs your friends will love on Empatify."

  const pageUrl = `/${locale}/u/${encodeURIComponent(handle)}`
  const ogImageUrl = `${pageUrl}/opengraph-image`

  return {
    title: titleTag,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: titleTag,
      description,
      url: pageUrl,
      type: "profile",
      siteName: "Empatify",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName} — Sonic Soul on Empatify`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleTag,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function PublicSoulPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>
}) {
  const { locale, handle } = await params
  const user = await loadUserByHandle(handle)
  if (!user) notFound()

  const t = await getTranslations({ locale, namespace: "viralCard" })
  const tShare = await getTranslations({ locale, namespace: "share" })

  const shareUrl = `${BASE_URL}/${locale}/u/${encodeURIComponent(handle)}`
  const topSongs = (user.topSongs ?? []).slice(0, 3)

  return (
    <div className="min-h-screen bg-neutral-50 text-white flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Sonic Soul card — same visual language as the settings card */}
        <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-neutral-950 shadow-2xl">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/15 rounded-full blur-[100px]" />

          <div className="relative z-10 p-8 md:p-10 flex flex-col items-center">
            <div className="size-28 rounded-full overflow-hidden border-2 border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-6 bg-neutral-900">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-neutral-600">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h1
              className="text-4xl font-black text-white tracking-tight mb-2 text-center"
              style={{ fontFamily: "Unbounded, sans-serif" }}
            >
              {user.name}
            </h1>
            <p className="text-primary-500 font-black text-xs tracking-[0.2em] uppercase italic mb-8">
              {t("title")}
            </p>

            <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl mb-4">
              <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] mb-4 font-black">
                {t("topSongs")}
              </p>
              <div className="space-y-3">
                {topSongs.length > 0 ? (
                  topSongs.map((song, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-primary-500 font-black italic text-lg">#{i + 1}</span>
                      <span className="text-white font-bold truncate">{song}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-500 italic text-sm">
                    Play more games to reveal this sonic fingerprint...
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl text-center">
                <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-2 font-black">
                  Empathy
                </p>
                <p className="text-3xl font-black text-white italic">{user.averageRatingReceived}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl text-center">
                <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-2 font-black">
                  Games
                </p>
                <p className="text-3xl font-black text-white">{user.totalGamesPlayed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Share + CTA */}
        <div className="mt-8 flex flex-col gap-3">
          <ShareSoulEntry
            shareUrl={shareUrl}
            displayName={user.name}
            labels={{
              shareButton: tShare("shareCard"),
              title: tShare("title"),
              copy: tShare("copy"),
              copied: tShare("copied"),
              download: tShare("download"),
              caption: tShare("caption", { name: user.name }),
            }}
          />
          <a
            href={`/${locale}`}
            className="w-full h-12 rounded-full flex items-center justify-center font-display font-black text-sm text-white bg-primary-500 hover:bg-primary-600 transition-colors"
          >
            {tShare("playOnEmpatify")}
          </a>
        </div>
      </div>
    </div>
  )
}
