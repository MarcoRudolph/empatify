import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { SelectSongPageClient } from "@/app/lobby/[id]/select-song/SelectSongPageClient"

interface SelectSongPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function LocalizedSelectSongPage({ params }: SelectSongPageProps) {
  const { locale, id } = await params

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/${locale}/login?redirect=/${locale}/lobby/${id}/select-song`)
  }

  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider messages={messages}>
      <SelectSongPageClient />
    </NextIntlClientProvider>
  )
}
