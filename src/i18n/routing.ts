import { locales, defaultLocale, localePrefix } from '../i18n';
import { createLocalizedPathnamesNavigation, createSharedPathnamesNavigation } from 'next-intl/navigation';

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales, localePrefix });

