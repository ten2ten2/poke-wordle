import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import PrivacyAndTermsContent from '@/components/PrivacyAndTermsContent';
import { localePath, routing } from '@/i18n/routing';
import { pageAlternates, pageMetadata, privacyMetadata } from '@/config/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return pageMetadata({
    locale, ...privacyMetadata[locale], path: localePath(locale, '/privacy-and-terms'),
    languages: pageAlternates('/privacy-and-terms'),
  });
}

export default async function PrivacyAndTermsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <PrivacyAndTermsContent />;
}
