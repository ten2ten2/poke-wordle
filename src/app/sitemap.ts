import type { MetadataRoute } from 'next';
import {
  KNOWLEDGE_SUPPORTED_LOCALES,
  getArticleAlternates,
  knowledgeData,
} from '@/config/knowledge';
import { routing, localePath } from '@/i18n/routing';
import { SITE_URL } from '@/config/seo';

const baseUrl = SITE_URL;
const absolute = (paths: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(paths).map(([locale, path]) => [locale, baseUrl + path]),
  );

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const path of ['/', '/privacy-and-terms', '/knowledge']) {
    const locales =
      path === '/knowledge' ? KNOWLEDGE_SUPPORTED_LOCALES : routing.locales;
    const languages = absolute(
      Object.fromEntries(
        locales.map((locale) => [locale, localePath(locale, path)]),
      ),
    );
    languages['x-default'] = languages.en;
    for (const locale of locales) {
      entries.push({ url: languages[locale], alternates: { languages } });
    }
  }
  for (const locale of KNOWLEDGE_SUPPORTED_LOCALES) {
    for (const article of knowledgeData[locale]) {
      entries.push({
        url:
          baseUrl +
          localePath(locale, `/knowledge/${encodeURIComponent(article.slug)}`),
        lastModified: article.updatedAt ?? article.createdAt,
        alternates: {
          languages: absolute(getArticleAlternates(locale, article)),
        },
      });
    }
  }
  return entries;
}
