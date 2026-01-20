import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMessages } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { NextIntlClientProvider } from "next-intl"
import { ConversationDetailClient } from "./ConversationDetailClient"

interface ConversationPageProps {
  params: Promise<{ locale: string; userId: string }>
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { locale, userId } = await params

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
      <ConversationDetailClient locale={locale} otherUserId={userId} />
    </NextIntlClientProvider>
  )
}
