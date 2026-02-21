import { locales, localePrefix } from '../../i18n';
import { createNavigation } from 'next-intl/navigation';

export const { Link, redirect, usePathname, useRouter } =
  createNavigation({ locales, localePrefix });

