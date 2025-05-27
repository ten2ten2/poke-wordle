import { MetadataRoute } from 'next';

const locales = ['en', 'ja', 'fr', 'de', 'it', 'es', 'ko', 'zh-hans', 'zh-hant'];
const baseUrl = 'https://www.pokewordle.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();
  
  // Generate sitemap entries for all locales (main game pages)
  const localeEntries = locales.map((locale) => {
    // Generate correct URL for English vs other locales
    const localeUrl = locale === 'en' ? baseUrl : `${baseUrl}/${locale}`;
    
    // Create alternates object with x-default for English
    const alternates: Record<string, string> = {};
    
    // Add x-default for the main language (English)
    if (locale === 'en') {
      alternates['x-default'] = baseUrl;
    }
    
    // Add all language alternates
    locales.forEach(loc => {
      const langCode = loc === 'zh-hans' ? 'zh-Hans' : loc === 'zh-hant' ? 'zh-Hant' : loc;
      const langUrl = loc === 'en' ? baseUrl : `${baseUrl}/${loc}`;
      alternates[langCode] = langUrl;
    });
    
    return {
      url: localeUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: locale === 'en' ? 1.0 : 0.9,
      alternates: {
        languages: alternates
      }
    };
  });

  // Generate privacy and terms pages for all locales
  const privacyEntries = locales.map((locale) => {
    const privacyUrl = locale === 'en' 
      ? `${baseUrl}/privacy-and-terms` 
      : `${baseUrl}/${locale}/privacy-and-terms`;
    
    // Create alternates object with x-default for English
    const alternates: Record<string, string> = {};
    
    // Add x-default for the main language (English)
    if (locale === 'en') {
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
    
    return {
      url: privacyUrl,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      alternates: {
        languages: alternates
      }
    };
  });

  // Return only locale entries and privacy entries (no separate root entry to avoid duplication)
  return [...localeEntries, ...privacyEntries];
} 