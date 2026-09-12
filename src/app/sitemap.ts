import type { MetadataRoute } from 'next';
import {
  getArticleAlternates,
  knowledgeData,
  knowledgeArticlePath,
} from '@/config/knowledge';
import { routing } from '@/i18n/routing';
import { absoluteUrl, pageAlternates } from '@/config/seo';

const absolute = (paths: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(paths).map(([locale, path]) => [locale, absoluteUrl(path)]),
  );

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const path of ['/', '/privacy-and-terms', '/knowledge']) {
    const languages = absolute(pageAlternates(path));
    for (const locale of routing.locales) {
      entries.push({ url: languages[locale], alternates: { languages } });
    }
  }
  for (const locale of routing.locales) {
    for (const article of knowledgeData[locale]) {
      entries.push({
        url: absoluteUrl(knowledgeArticlePath(locale, article.slug)),
        lastModified: article.updatedAt ?? article.createdAt,
        alternates: {
          languages: absolute(getArticleAlternates(locale, article)),
        },
      });
    }
  }
  return entries;
}
