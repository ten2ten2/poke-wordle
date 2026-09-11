import knowledgeDataRaw from '@/data/knowledge_data.json';
import { localePath } from '@/i18n/routing';

/**
 * Configuration for Knowledge page availability
 */

// Locales that have Knowledge page available
export const KNOWLEDGE_SUPPORTED_LOCALES = [
  'en',
  'ja',
  'zh-hans',
  'zh-hant',
] as const;

// Type for supported knowledge locales
export type KnowledgeSupportedLocale =
  (typeof KNOWLEDGE_SUPPORTED_LOCALES)[number];

// Knowledge article interface
export interface KnowledgeArticle {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  translations?: {
    [locale: string]: {
      slug: string;
    };
  };
}

// Knowledge data structure
export interface KnowledgeData {
  en: KnowledgeArticle[];
  ja: KnowledgeArticle[];
  'zh-hans': KnowledgeArticle[];
  'zh-hant': KnowledgeArticle[];
}

// Keep empty language lists typed independently of the current JSON contents.
export const knowledgeData: KnowledgeData = knowledgeDataRaw;

/**
 * Check if a locale supports the Knowledge page
 */
export function isKnowledgeSupported(
  locale: string,
): locale is KnowledgeSupportedLocale {
  return KNOWLEDGE_SUPPORTED_LOCALES.includes(
    locale as KnowledgeSupportedLocale,
  );
}

export function findKnowledgeArticle(locale: string, slug: string): KnowledgeArticle | undefined {
  if (!isKnowledgeSupported(locale)) return undefined;
  return knowledgeData[locale].find(
    (article) =>
      article.slug === slug || encodeURIComponent(article.slug) === slug,
  );
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
      !isKnowledgeSupported(language) ||
      !knowledgeData[language].some((item) => item.slug === slug)
    )
      continue;
    languages[language] = localePath(
      language,
      `/knowledge/${encodeURIComponent(slug)}`,
    );
  }
  if (languages.en) languages['x-default'] = languages.en;
  return languages;
}
