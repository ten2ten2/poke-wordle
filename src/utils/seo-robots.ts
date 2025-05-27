/**
 * SEO and Robots configuration utilities
 */

export const SEARCH_ENGINE_BOTS = {
  // Major search engines
  GOOGLE: 'Googlebot',
  BING: 'Bingbot',
  YAHOO: 'Slurp',
  DUCKDUCKGO: 'DuckDuckBot',
  BAIDU: 'Baiduspider',
  YANDEX: 'YandexBot',
  
  // Social media crawlers
  FACEBOOK: 'facebookexternalhit',
  TWITTER: 'Twitterbot',
  LINKEDIN: 'LinkedInBot',
  DISCORD: 'Discordbot',
  
  // AI training bots to block
  OPENAI_GPT: 'GPTBot',
  OPENAI_CHATGPT: 'ChatGPT-User',
  ANTHROPIC: 'anthropic-ai',
  ANTHROPIC_CLAUDE: 'Claude-Web',
  COMMON_CRAWL: 'CCBot',
  PERPLEXITY: 'PerplexityBot',
  APPLE_EXTENDED: 'Applebot-Extended',
  FACEBOOK_AI: 'FacebookBot',
} as const;

export const ALLOWED_PATHS = [
  '/',
  '/ja',
  '/fr',
  '/de',
  '/it',
  '/es',
  '/ko',
  '/zh-hans',
  '/zh-hant',
  '/privacy-and-terms',
  '/ja/privacy-and-terms',
  '/fr/privacy-and-terms',
  '/de/privacy-and-terms',
  '/it/privacy-and-terms',
  '/es/privacy-and-terms',
  '/ko/privacy-and-terms',
  '/zh-hans/privacy-and-terms',
  '/zh-hant/privacy-and-terms',
] as const;

export const DISALLOWED_PATHS = [
  '/api/internal/',
  '/_next/static/chunks/',
  '/private/',
  '*.json$',
  '/temp/',
  '/admin/',
  '/test/',
  '/debug/',
] as const;

export const ROBOTS_META_TAGS = {
  // For main game pages
  GAME_PAGE: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
  
  // For privacy/terms pages
  LEGAL_PAGE: 'index,follow,max-snippet:200,max-image-preview:standard',
  
  // For API routes (if needed)
  API_NOINDEX: 'noindex,nofollow',
  
  // For development/test pages
  DEV_NOINDEX: 'noindex,nofollow,noarchive,nosnippet',
} as const;

/**
 * Generate robots meta tag content based on page type
 */
export function getRobotsMetaTag(pageType: keyof typeof ROBOTS_META_TAGS): string {
  return ROBOTS_META_TAGS[pageType];
}

/**
 * Check if a user agent should be allowed
 */
export function isAllowedBot(userAgent: string): boolean {
  const blockedBots = [
    SEARCH_ENGINE_BOTS.OPENAI_GPT,
    SEARCH_ENGINE_BOTS.OPENAI_CHATGPT,
    SEARCH_ENGINE_BOTS.ANTHROPIC,
    SEARCH_ENGINE_BOTS.ANTHROPIC_CLAUDE,
    SEARCH_ENGINE_BOTS.COMMON_CRAWL,
    SEARCH_ENGINE_BOTS.PERPLEXITY,
    SEARCH_ENGINE_BOTS.APPLE_EXTENDED,
    SEARCH_ENGINE_BOTS.FACEBOOK_AI,
  ];
  
  return !blockedBots.some(bot => userAgent.includes(bot));
}

/**
 * Generate structured data for better SEO
 */
export function generateWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Poke Wordle",
    "alternateName": ["Pokemon Wordle", "宝可梦猜猜乐", "ポケワードル"],
    "url": "https://www.pokewordle.app",
    "description": "A Pokemon guessing game where you identify Pokemon based on their attributes, stats, abilities, and evolution methods.",
    "inLanguage": ["en", "ja", "fr", "de", "it", "es", "ko", "zh-Hans", "zh-Hant"],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.pokewordle.app/?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Poke Wordle Team",
      "url": "https://www.pokewordle.app"
    }
  };
} 