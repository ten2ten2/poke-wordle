import { MetadataRoute } from 'next';

const locales = ['en', 'ja', 'fr', 'de', 'it', 'es', 'ko', 'zh-hans', 'zh-hant'];
const baseUrl = 'https://www.pokewordle.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();
  
  // Generate sitemap entries for all locales
  const localeEntries = locales.map((locale) => {
    // Generate correct URL for English vs other locales
    const localeUrl = locale === 'en' ? baseUrl : `${baseUrl}/${locale}`;
    
    return {
      url: localeUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: locale === 'en' ? 1.0 : 0.9,
      alternates: {
        languages: Object.fromEntries(
          locales.map(loc => {
            const langCode = loc === 'zh-hans' ? 'zh-Hans' : loc === 'zh-hant' ? 'zh-Hant' : loc;
            const langUrl = loc === 'en' ? baseUrl : `${baseUrl}/${loc}`;
            return [langCode, langUrl];
          })
        )
      }
    };
  });

  // Add root URL that redirects to English
  const rootEntry = {
    url: baseUrl,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 1.0,
    alternates: {
      languages: Object.fromEntries(
        locales.map(loc => {
          const langCode = loc === 'zh-hans' ? 'zh-Hans' : loc === 'zh-hant' ? 'zh-Hant' : loc;
          const langUrl = loc === 'en' ? baseUrl : `${baseUrl}/${loc}`;
          return [langCode, langUrl];
        })
      )
    }
  };

  return [rootEntry, ...localeEntries];
} 