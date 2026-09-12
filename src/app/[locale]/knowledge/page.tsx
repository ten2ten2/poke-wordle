import { getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KnowledgeArchive from '@/components/KnowledgeArchive';
import { pageAlternates, pageMetadata } from '@/config/seo';
import { localePath, routing } from '@/i18n/routing';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: 'knowledge' });

  const title = t('seoTitle');
  const description = t('description');
  return pageMetadata({
    locale, title, description, path: localePath(locale, '/knowledge'),
    languages: pageAlternates('/knowledge'),
  });
}

export default async function KnowledgePage({ params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  return <KnowledgeArchive locale={locale} />;
}
