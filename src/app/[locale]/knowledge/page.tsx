import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KnowledgeArchive from '@/components/KnowledgeArchive';
import {
  isKnowledgeSupported,
  KNOWLEDGE_SUPPORTED_LOCALES,
} from '@/config/knowledge';

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

  const title = t('title');
  const description = t('description');

  // Generate correct URLs for English vs other locales
  const canonicalUrl = locale === 'en' ? '/knowledge' : `/${locale}/knowledge`;
  const ogUrl =
    locale === 'en'
      ? 'https://www.pokewordle.app/knowledge'
      : `https://www.pokewordle.app/${locale}/knowledge`;

  // Generate language alternates only for supported locales
  const languages: Record<string, string> = {
    'x-default': '/knowledge',
  };

  KNOWLEDGE_SUPPORTED_LOCALES.forEach((supportedLocale) => {
    const langCode =
      supportedLocale === 'zh-hans'
        ? 'zh-Hans'
        : supportedLocale === 'zh-hant'
          ? 'zh-Hant'
          : supportedLocale;
    const langUrl =
      supportedLocale === 'en' ? '/knowledge' : `/${supportedLocale}/knowledge`;
    languages[langCode] = langUrl;
  });

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title,
      description,
      url: ogUrl,
    },
    twitter: {
      title,
      description,
    },
  };
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
