import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMessages } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { NextIntlClientProvider } from "next-intl"
import { MessagesOverviewClient } from "./MessagesOverviewClient"

interface MessagesPageProps {
  params: Promise<{ locale: string }>
}

export default async function MessagesPage({ params }: MessagesPageProps) {
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
      <MessagesOverviewClient locale={locale} />
    </NextIntlClientProvider>
  )
}
