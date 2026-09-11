import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KnowledgeArticle from '@/components/KnowledgeArticle';
import {
  getArticleAlternates,
  findKnowledgeArticle,
  isKnowledgeSupported,
  KNOWLEDGE_SUPPORTED_LOCALES,
  KnowledgeData,
} from '@/config/knowledge';
import knowledgeDataRaw from '@/data/knowledge_data.json';
import { localePath } from '@/i18n/routing';

const knowledgeData = knowledgeDataRaw as KnowledgeData;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  // Check if locale supports knowledge page
  if (!isKnowledgeSupported(locale)) {
    return {};
  }

  // Find the article in the locale's data
  const article = findKnowledgeArticle(locale, slug);

  if (!article) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: 'knowledge' });

  const canonicalUrl = localePath(
    locale,
    `/knowledge/${encodeURIComponent(article.slug)}`,
  );
  const ogUrl = `https://www.pokewordle.app${canonicalUrl}`;

  return {
    title: `${article.title} - ${t('title')} - Poke Wordle`,
    description: `Learn about ${article.title} in our comprehensive Pokémon knowledge base.`,
    keywords: [
      'pokemon knowledge',
      'pokemon tips',
      'legends z-a',
      'pokemon game',
      'ptcg',
      'nintendo',
      'pokemon go',
      'pokemon training card game',
      article.title.toLowerCase(),
    ],
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: getArticleAlternates(locale, article),
    },
    openGraph: {
      title: `${article.title} - ${t('title')} - Poke Wordle`,
      description: `Learn about ${article.title} in our comprehensive Pokémon knowledge base.`,
      url: ogUrl,
      type: 'article',
      siteName: 'Poke Wordle',
      publishedTime: article.createdAt,
    },
    twitter: {
      card: 'summary',
      title: `${article.title} - ${t('title')} - Poke Wordle`,
      description: `Learn about ${article.title} in our comprehensive Pokémon knowledge base.`,
    },
  };
}

export function generateStaticParams() {
  return KNOWLEDGE_SUPPORTED_LOCALES.flatMap((locale) =>
    knowledgeData[locale].map((article) => ({ locale, slug: article.slug })),
  );
}

export default async function KnowledgeArticlePage({ params }: Props) {
  const { locale, slug } = await params;

  // Check if locale supports knowledge page, return 404 if not
  if (!isKnowledgeSupported(locale)) {
    notFound();
  }

  // Find the article in the locale's data
  const article = findKnowledgeArticle(locale, slug);

  if (!article) {
    notFound();
  }

  setRequestLocale(locale);
  return <KnowledgeArticle article={article} locale={locale} />;
}
