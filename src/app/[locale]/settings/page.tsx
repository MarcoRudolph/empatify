import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/ui/Navbar"
import { SettingsPageClient } from "./SettingsPageClient"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * Settings page - User profile and account management
 * Features: Name editing, Spotify connection management, Account deletion
 */
export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Get user record from database to check Spotify status
  const userRecord = await db
    .select()
    .from(users)
    .where(eq(users.email, user.email!))
    .limit(1)

  const dbUser = userRecord.length > 0 ? userRecord[0] : null
  const isSpotifyLinked =
    !!dbUser?.spotifyAccessToken &&
    !!dbUser?.spotifyRefreshToken &&
    dbUser.spotifyTokenExpiresAt &&
    new Date(dbUser.spotifyTokenExpiresAt) > new Date()

  return (
    <>
      <Navbar locale={locale} />
      <SettingsPageClient 
        locale={locale} 
        user={user} 
        isSpotifyLinked={isSpotifyLinked}
      />
    </>
  )
}

