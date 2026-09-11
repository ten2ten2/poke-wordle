import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KnowledgeArchive from '@/components/KnowledgeArchive';
import {
  isKnowledgeSupported,
  KNOWLEDGE_SUPPORTED_LOCALES,
} from '@/config/knowledge';
import { pageAlternates, pageMetadata } from '@/config/seo';
import { localePath } from '@/i18n/routing';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  // Check if locale supports knowledge page
  if (!isKnowledgeSupported(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: 'knowledge' });

  const title = t('seoTitle');
  const description = t('description');
  return pageMetadata({
    locale, title, description, path: localePath(locale, '/knowledge'),
    languages: pageAlternates('/knowledge', KNOWLEDGE_SUPPORTED_LOCALES),
  });
}

export default async function KnowledgePage({ params }: Props) {
  const { locale } = await params;

  // Check if locale supports knowledge page, return 404 if not
  if (!isKnowledgeSupported(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <KnowledgeArchive />;
}
