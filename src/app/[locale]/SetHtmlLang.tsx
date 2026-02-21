'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';

/**
 * Sets document.documentElement.lang to the active locale for a11y and SEO.
 * Used inside [locale] layout so only locale-prefixed routes get the correct lang.
 */
export function SetHtmlLang() {
  const locale = useLocale();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
