import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMessages } from "next-intl/server"
import { NextIntlClientProvider } from "next-intl"
import { MessagesOverviewClient } from "./MessagesOverviewClient"

interface MessagesPageProps {
  params: Promise<{ locale: string }>
}

export default async function MessagesPage({ params }: MessagesPageProps) {
  const { locale } = await params

  const supabase = await createClient()
  const [authResult, messages] = await Promise.all([
    supabase.auth.getUser(),
    getMessages({ locale }),
  ])

  const {
    data: { user },
    error: authError,
  } = authResult

  if (authError || !user) {
    redirect(`/${locale}/login`)
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <MessagesOverviewClient locale={locale} />
    </NextIntlClientProvider>
  )
}
