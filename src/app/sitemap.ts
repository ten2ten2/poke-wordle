import { MetadataRoute } from 'next';
import { KNOWLEDGE_SUPPORTED_LOCALES } from '@/config/knowledge';

const locales = ['en', 'ja', 'fr', 'de', 'it', 'es', 'ko', 'zh-hans', 'zh-hant'];
const baseUrl = 'https://www.pokewordle.app';

// Helper function to create language alternates
function createLanguageAlternates(includeXDefault: boolean = false): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  // Add x-default for the main language (English) if requested
  if (includeXDefault) {
    alternates['x-default'] = baseUrl;
  }
  
  // Add all language alternates
  locales.forEach(loc => {
    const langCode = loc === 'zh-hans' ? 'zh-Hans' : loc === 'zh-hant' ? 'zh-Hant' : loc;
    const langUrl = loc === 'en' ? baseUrl : `${baseUrl}/${loc}`;
    alternates[langCode] = langUrl;
  });
  
  return alternates;
}

// Helper function to create privacy page alternates
function createPrivacyAlternates(includeXDefault: boolean = false): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  // Add x-default for the main language (English) if requested
  if (includeXDefault) {
    alternates['x-default'] = `${baseUrl}/privacy-and-terms`;
  }
  
  // Add all language alternates
  locales.forEach(loc => {
    const langCode = loc === 'zh-hans' ? 'zh-Hans' : loc === 'zh-hant' ? 'zh-Hant' : loc;
    const langUrl = loc === 'en' 
      ? `${baseUrl}/privacy-and-terms` 
      : `${baseUrl}/${loc}/privacy-and-terms`;
    alternates[langCode] = langUrl;
  });
  
  return alternates;
}

// Helper function to create knowledge list page alternates
function createKnowledgeAlternates(includeXDefault: boolean = false): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  // Add x-default for the main language (English) if requested
  if (includeXDefault) {
    alternates['x-default'] = `${baseUrl}/knowledge`;
  }
  
  // Add language alternates only for supported locales
  KNOWLEDGE_SUPPORTED_LOCALES.forEach(loc => {
    const langCode = loc === 'zh-hans' ? 'zh-Hans' : loc === 'zh-hant' ? 'zh-Hant' : loc;
    const langUrl = loc === 'en'
      ? `${baseUrl}/knowledge` 
      : `${baseUrl}/${loc}/knowledge`;
    alternates[langCode] = langUrl;
  });
  
  return alternates;
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Use more precise timestamp with proper ISO formatting
  const currentDate = new Date();
  const lastModified = currentDate.toISOString();
  
  // Generate sitemap entries for all locales (main game pages)
  const localeEntries = locales.map((locale) => {
    const localeUrl = locale === 'en' ? baseUrl : `${baseUrl}/${locale}`;
    const isMainLocale = locale === 'en';
    
    return {
      url: localeUrl,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: isMainLocale ? 1.0 : 0.9,
      alternates: {
        languages: createLanguageAlternates(isMainLocale)
      }
    };
  });

  // Generate privacy and terms pages for all locales
  const privacyEntries = locales.map((locale) => {
    const privacyUrl = locale === 'en' 
      ? `${baseUrl}/privacy-and-terms` 
      : `${baseUrl}/${locale}/privacy-and-terms`;
    const isMainLocale = locale === 'en';
    
    return {
      url: privacyUrl,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      alternates: {
        languages: createPrivacyAlternates(isMainLocale)
      }
    };
  });

  // Generate knowledge archive page only for supported locales
  const knowledgeEntries = KNOWLEDGE_SUPPORTED_LOCALES.map((locale) => {
    const knowledgeUrl = locale === 'en' 
      ? `${baseUrl}/knowledge` 
      : `${baseUrl}/${locale}/knowledge`;
    const isMainLocale = locale === 'en';

    return {
      url: knowledgeUrl,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: {
        languages: createKnowledgeAlternates(isMainLocale)
      }
    };
  });

  // Combine all entries with main pages first for better SEO
  return [...localeEntries, ...privacyEntries, ...knowledgeEntries];
} 