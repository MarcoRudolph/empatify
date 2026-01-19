import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { SpotifySetupClient } from "./SpotifySetupClient"

interface SpotifySetupPageProps {
  params: Promise<{ locale: string }>
}

/**
 * Spotify Setup Helper Page
 * Shows the required Redirect URI and setup instructions
 */
export default async function SpotifySetupPage({ params }: SpotifySetupPageProps) {
  const { locale } = await params

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/${locale}/login`)
  }

  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider messages={messages}>
      <SpotifySetupClient locale={locale} />
    </NextIntlClientProvider>
  )
}
