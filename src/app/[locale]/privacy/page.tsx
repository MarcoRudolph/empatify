import { redirect } from "next/navigation"

/**
 * /privacy redirects to /datenschutz (the actual privacy policy page).
 * Needed because next-intl localePrefix='always' intercepts /privacy
 * and rewrites it to /[locale]/privacy before routing.
 */
export default function PrivacyRedirect({
  params,
}: {
  params: { locale: string }
}) {
  redirect(`/${params.locale}/datenschutz`)
}
