import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
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

  return <MessagesOverviewClient locale={locale} />
}
