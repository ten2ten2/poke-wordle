import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import KnowledgeArchive from '@/components/KnowledgeArchive';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  
  const title = t('title');
  const description = t('description');
  
  // Generate correct URLs for English vs other locales
  const canonicalUrl = locale === 'en' ? '/knowledge' : `/${locale}/knowledge`;
  const ogUrl = locale === 'en' ? 'https://www.pokewordle.app/knowledge' : `https://www.pokewordle.app/${locale}/knowledge`;
  
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'x-default': '/knowledge',
        'en': '/knowledge',
        'ja': '/ja/knowledge',
        'zh-Hans': '/zh-hans/knowledge',
        'zh-Hant': '/zh-hant/knowledge',
      },
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

export default function KnowledgePage() {
  return <KnowledgeArchive />;
}
