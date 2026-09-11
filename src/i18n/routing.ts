import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ja', 'fr', 'de', 'it', 'es', 'ko', 'zh-hans', 'zh-hant'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeDetection: false,
  alternateLinks: false,
});

export function localePath(locale: string, path = '/') {
  return locale === 'en' ? path : `/${locale}${path === '/' ? '' : path}`;
}
