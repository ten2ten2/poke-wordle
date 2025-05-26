import type { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  locale: string;
  alternateLocales?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  twitterImage?: string;
  structuredData?: Record<string, any>;
}

export function generateSEOMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    locale,
    alternateLocales = [],
    canonicalUrl,
    ogImage = '/images/og-image.png',
    twitterImage = '/images/twitter-image.png',
    structuredData
  } = config;

  const baseUrl = 'https://poke-wordle.vercel.app';
  
  return {
    title,
    description,
    keywords: keywords.join(', '),
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLocales.reduce((acc, loc) => {
        acc[loc] = `${baseUrl}/${loc}`;
        return acc;
      }, {} as Record<string, string>),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl || baseUrl,
      siteName: 'Poke Wordle',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [twitterImage],
    },
    other: structuredData ? {
      'structured-data': JSON.stringify(structuredData)
    } : undefined,
  };
}

export function generateGameStructuredData(locale: string) {
  const localeNames = {
    en: 'English',
    ja: '日本語',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    es: 'Español',
    ko: '한국어',
    'zh-hans': '简体中文',
    'zh-hant': '繁體中文',
  };

  return {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Poke Wordle",
    "description": "Test your Pokémon knowledge with Poke Wordle! Guess the Pokémon based on its attributes, stats, abilities, evolution, and more.",
    "url": `https://poke-wordle.vercel.app/${locale}`,
    "genre": ["Puzzle", "Educational", "Trivia"],
    "gamePlatform": "Web Browser",
    "operatingSystem": "Any",
    "applicationCategory": "Game",
    "inLanguage": locale,
    "isAccessibleForFree": true,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "author": {
      "@type": "Organization",
      "name": "Poke Wordle Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Poke Wordle"
    },
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "keywords": "pokemon, wordle, game, puzzle, guess, pokemon game, pokemon quiz, nintendo, gamefreak",
    "audience": {
      "@type": "Audience",
      "audienceType": "Pokemon fans, puzzle game enthusiasts, casual gamers"
    },
    "educationalUse": "Entertainment, Pokemon knowledge testing",
    "interactivityType": "active",
    "learningResourceType": "game",
    "typicalAgeRange": "8-99",
    "accessibilityFeature": [
      "alternativeText",
      "keyboardNavigation",
      "highContrast"
    ],
    "accessibilityHazard": "none",
    "accessibilityAPI": "ARIA"
  };
}

export function generateBreadcrumbStructuredData(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://poke-wordle.vercel.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": `Game (${locale.toUpperCase()})`,
        "item": `https://poke-wordle.vercel.app/${locale}`
      }
    ]
  };
}

export function generateWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Poke Wordle",
    "alternateName": "Pokemon Wordle Game",
    "url": "https://poke-wordle.vercel.app",
    "description": "Test your Pokémon knowledge with Poke Wordle! Guess the Pokémon based on its attributes, stats, abilities, evolution, and more.",
    "inLanguage": ["en", "ja", "fr", "de", "it", "es", "ko", "zh-Hans", "zh-Hant"],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://poke-wordle.vercel.app/{locale}",
        "actionPlatform": [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform"
        ]
      },
      "query-input": "required name=locale"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Poke Wordle Team"
    },
    "copyrightYear": new Date().getFullYear(),
    "genre": "Game",
    "keywords": "pokemon, wordle, game, puzzle, guess, pokemon game, pokemon quiz"
  };
}

export function generateFAQStructuredData(locale: string) {
  // This would typically come from your translation files
  const faqs = {
    en: [
      {
        question: "How do I play Poke Wordle?",
        answer: "Enter a Pokémon name to start guessing. The game will show you how close your guess is to the target Pokémon based on various attributes like type, stats, generation, abilities, and evolution."
      },
      {
        question: "Is Poke Wordle free to play?",
        answer: "Yes! Poke Wordle is completely free to play in your web browser."
      },
      {
        question: "What languages does Poke Wordle support?",
        answer: "Poke Wordle supports English, Japanese, French, German, Italian, Spanish, Korean, and Chinese (Simplified and Traditional)."
      },
      {
        question: "How many guesses do I get?",
        answer: "By default, you get 6 guesses to find the correct Pokémon, but this can be adjusted in the settings."
      }
    ],
    // Add other languages as needed
  };

  const localeFAQs = faqs[locale as keyof typeof faqs] || faqs.en;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": localeFAQs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
} 