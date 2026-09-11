import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KnowledgeArticle from '@/components/KnowledgeArticle';
import {
  getArticleAlternates,
  findKnowledgeArticle,
  isKnowledgeSupported,
  KNOWLEDGE_SUPPORTED_LOCALES,
  knowledgeData,
  knowledgeArticlePath,
} from '@/config/knowledge';
import { pageMetadata } from '@/config/seo';

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

  return pageMetadata({
    locale, title: article.seoTitle || `${article.title} - Poke Wordle`,
    description: article.description, image: article.image, article,
    path: knowledgeArticlePath(locale, article.slug),
    languages: getArticleAlternates(locale, article),
  });
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
