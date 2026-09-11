import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { localePath, routing } from '@/i18n/routing';
import { pageAlternates, pageMetadata, privacyMetadata } from '@/config/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return pageMetadata({
    locale, ...privacyMetadata[locale], path: localePath(locale, '/privacy-and-terms'),
    languages: pageAlternates('/privacy-and-terms'),
  });
}

export default function PrivacyAndTermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
