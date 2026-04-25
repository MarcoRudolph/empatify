import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMessages } from "next-intl/server"
import { NextIntlClientProvider } from "next-intl"
import { Loader2 } from "lucide-react"
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
      {/* SSR-rendered first-paint shell — fires MESSAGES_READY_SELECTOR on
          RSC application, before client hydration. MessagesOverviewClient
          mounts immediately after and replaces this with the full UI. */}
      <div className="min-h-screen bg-neutral-50 pt-16">
        <div className="max-w-container mx-auto px-6 py-8">
          <div data-testid="messages-empty-state" className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary-500" />
          </div>
        </div>
      </div>
      <MessagesOverviewClient locale={locale} />
    </NextIntlClientProvider>
  )
}
