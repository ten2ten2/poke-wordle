import knowledgeDataRaw from '@/data/knowledge_data.json';
import redirects from '@/data/knowledge-redirects.json';
import { hasLocale } from 'next-intl';
import { localePath, routing, type Locale } from '@/i18n/routing';

export interface KnowledgeArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  seoTitle?: string;
  image?: string;
  createdAt: string;
  updatedAt?: string;
  translations?: {
    [locale: string]: {
      slug: string;
    };
  };
}

export type KnowledgeData = Record<Locale, KnowledgeArticle[]>;

// Keep empty language lists typed independently of the current JSON contents.
export const knowledgeData: KnowledgeData = knowledgeDataRaw;

export function findKnowledgeArticle(locale: string, slug: string): KnowledgeArticle | undefined {
  if (!hasLocale(routing.locales, locale)) return undefined;
  return knowledgeData[locale].find(
    (article) =>
      article.slug === slug || encodeURIComponent(article.slug) === slug,
  );
}

export function knowledgeArticlePath(locale: string, slug: string) {
  return localePath(locale, `/knowledge/${encodeURIComponent(slug)}`);
}

export function getKnowledgeRedirect(locale: string, slug: string): string | undefined {
  if (!hasLocale(routing.locales, locale)) return undefined;
  const alias = redirects.find((entry) => entry.locale === locale && entry.slug === slug);
  const article = alias && knowledgeData[locale].find((entry) => entry.id === alias.articleId);
  return article ? knowledgeArticlePath(locale, article.slug) : undefined;
}
export function getArticleAlternates(
  locale: string,
  article: KnowledgeArticle,
): Record<string, string> {
  const translations = {
    ...article.translations,
    [locale]: { slug: article.slug },
  };
  const languages: Record<string, string> = {};
  for (const [language, { slug }] of Object.entries(translations)) {
    if (
      !hasLocale(routing.locales, language) ||
      !knowledgeData[language].some((item) => item.slug === slug)
    )
      continue;
    languages[language] = knowledgeArticlePath(language, slug);
  }
  if (languages.en) languages['x-default'] = languages.en;
  return languages;
}
