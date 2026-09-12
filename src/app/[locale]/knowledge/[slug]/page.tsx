import { setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KnowledgeArticle from '@/components/KnowledgeArticle';
import {
  getArticleAlternates,
  findKnowledgeArticle,
  knowledgeData,
  knowledgeArticlePath,
} from '@/config/knowledge';
import { pageMetadata } from '@/config/seo';
import { routing } from '@/i18n/routing';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) return {};

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
  return routing.locales.flatMap((locale) =>
    knowledgeData[locale].map((article) => ({ locale, slug: article.slug })),
  );
}

export default async function KnowledgeArticlePage({ params }: Props) {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  const article = findKnowledgeArticle(locale, slug);

  if (!article) {
    notFound();
  }

  setRequestLocale(locale);
  return <KnowledgeArticle article={article} locale={locale} />;
}
