import { MetadataRoute } from 'next';

const locales = ['en', 'ja', 'fr', 'de', 'it', 'es', 'ko', 'zh-hans', 'zh-hant'];
const baseUrl = 'https://poke-wordle.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();
  
  // Generate sitemap entries for all locales
  const localeEntries = locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: locale === 'en' ? 1.0 : 0.9,
    alternates: {
      languages: Object.fromEntries(
        locales.map(loc => [loc === 'zh-hans' ? 'zh-Hans' : loc === 'zh-hant' ? 'zh-Hant' : loc, `${baseUrl}/${loc}`])
      )
    }
  }));

  // Add root URL that redirects to English
  const rootEntry = {
    url: baseUrl,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 1.0,
    alternates: {
      languages: Object.fromEntries(
        locales.map(loc => [loc === 'zh-hans' ? 'zh-Hans' : loc === 'zh-hant' ? 'zh-Hant' : loc, `${baseUrl}/${loc}`])
      )
    }
  };

  return [rootEntry, ...localeEntries];
} 