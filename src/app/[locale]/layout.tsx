import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales } from '@/i18n';
import { CookieConsentLazy } from "@/components/ui/CookieConsentLazy";
import { SetHtmlLang } from './SetHtmlLang';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SetHtmlLang />
      {children}
      <CookieConsentLazy />
    </NextIntlClientProvider>
  );
}

