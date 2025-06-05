/**
 * Configuration for Knowledge page availability
 */

// Locales that have Knowledge page available
export const KNOWLEDGE_SUPPORTED_LOCALES = ['en', 'ja', 'zh-hans', 'zh-hant'] as const;

// Type for supported knowledge locales
export type KnowledgeSupportedLocale = typeof KNOWLEDGE_SUPPORTED_LOCALES[number];

/**
 * Check if a locale supports the Knowledge page
 */
export function isKnowledgeSupported(locale: string): locale is KnowledgeSupportedLocale {
  return KNOWLEDGE_SUPPORTED_LOCALES.includes(locale as KnowledgeSupportedLocale);
} 