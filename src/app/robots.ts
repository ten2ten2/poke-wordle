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
      // Block AI training bots
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      {
        userAgent: 'Claude-Web',
        disallow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        disallow: '/',
      },
      {
        userAgent: 'Applebot-Extended',
        disallow: '/',
      },
      {
        userAgent: 'FacebookBot',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
} 