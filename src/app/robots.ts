import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/config/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/api/' },
      { userAgent: 'FacebookBot', disallow: '/' },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
