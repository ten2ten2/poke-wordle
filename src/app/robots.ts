import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.pokewordle.app';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/_next/static/chunks/',
          '/private/',
          '*.json$',
          '/temp/',
          '/admin/',
        ],
        crawlDelay: 1,
      },
      // Allow specific search engine bots with optimized settings
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
      },
      {
        userAgent: 'Slurp', // Yahoo
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
      },
      {
        userAgent: 'DuckDuckBot',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
      },
      {
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
      },
      {
        userAgent: 'YandexBot',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
      },
      // Allow AI bots for indexing and training
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
        crawlDelay: 2,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
        crawlDelay: 2,
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
        crawlDelay: 2,
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
        crawlDelay: 2,
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
        crawlDelay: 2,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
        crawlDelay: 2,
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: [
          '/api/internal/',
          '/private/',
          '/admin/',
        ],
        crawlDelay: 2,
      },
      // Keep Facebook bot restricted for privacy
      {
        userAgent: 'FacebookBot',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
} 