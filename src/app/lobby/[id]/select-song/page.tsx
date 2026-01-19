import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { SelectSongPageClient } from "./SelectSongPageClient"

interface SelectSongPageProps {
  params: Promise<{ id: string }>
}

/**
 * Select Song page - allows user to search and select a song for a round
 * URL: /lobby/{uuid}/select-song
 * This route is NOT internationalized (no locale prefix) as it's part of the lobby flow
 */
export default async function SelectSongPage({ params }: SelectSongPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // If not authenticated, redirect to login with return URL
  if (authError || !user) {
    redirect(`/de/login?redirect=/lobby/${id}/select-song`)
  }

  // Get messages for default locale (German) to support translations
  const messages = await getMessages({ locale: routing.defaultLocale })

  return (
    <NextIntlClientProvider messages={messages}>
      <SelectSongPageClient />
    </NextIntlClientProvider>
  )
}
