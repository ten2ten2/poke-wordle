import { MetadataRoute } from 'next';

const locales = ['en', 'ja', 'fr', 'de', 'it', 'es', 'ko', 'zh-hans', 'zh-hant'];
const baseUrl = 'https://www.pokewordle.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();
  
  // Generate sitemap entries for all locales (main game pages)
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

  // Generate privacy and terms pages for all locales
  const privacyEntries = locales.map((locale) => {
    const privacyUrl = locale === 'en' 
      ? `${baseUrl}/privacy-and-terms` 
      : `${baseUrl}/${locale}/privacy-and-terms`;
    
    return {
      url: privacyUrl,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      alternates: {
        languages: Object.fromEntries(
          locales.map(loc => {
            const langCode = loc === 'zh-hans' ? 'zh-Hans' : loc === 'zh-hant' ? 'zh-Hant' : loc;
            const langUrl = loc === 'en' 
              ? `${baseUrl}/privacy-and-terms` 
              : `${baseUrl}/${loc}/privacy-and-terms`;
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

  return [rootEntry, ...localeEntries, ...privacyEntries];
} 