/**
 * Configuration for Knowledge page availability
 */

// Locales that have Knowledge page available
export const KNOWLEDGE_SUPPORTED_LOCALES = ['en', 'ja', 'zh-hans', 'zh-hant'] as const;

// Type for supported knowledge locales
export type KnowledgeSupportedLocale = typeof KNOWLEDGE_SUPPORTED_LOCALES[number];

// Knowledge article interface
export interface KnowledgeArticle {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
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

/**
 * Check if a locale supports the Knowledge page
 */
export function isKnowledgeSupported(locale: string): locale is KnowledgeSupportedLocale {
  return KNOWLEDGE_SUPPORTED_LOCALES.includes(locale as KnowledgeSupportedLocale);
} 