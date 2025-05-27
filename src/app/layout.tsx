import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import type { Metadata } from 'next';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import CookieConsentWrapper from '@/components/CookieConsentWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Poke Wordle - Guess the Pokémon Game',
    template: '%s | Poke Wordle'
  },
  description: 'Test your Pokémon knowledge with Poke Wordle! Guess the Pokémon based on its attributes, stats, abilities, evolution, and more. Play in multiple languages including English, Japanese, French, German, Italian, Spanish, Korean, and Chinese.',
  keywords: [
    'pokemon',
    'wordle',
    'game',
    'puzzle',
    'guess',
    'pokemon game',
    'pokemon quiz',
    'pokemon wordle',
    'pokemon guessing game',
    'nintendo',
    'gamefreak',
    'multilingual',
    'browser game',
    'free game'
  ],
  authors: [{ name: 'Poke Wordle Team' }],
  creator: 'Poke Wordle Team',
  publisher: 'Poke Wordle',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.pokewordle.app'),
  alternates: {
    canonical: '/',
    languages: {
      'en': '/',
      'ja': '/ja',
      'fr': '/fr',
      'de': '/de',
      'it': '/it',
      'es': '/es',
      'ko': '/ko',
      'zh-Hans': '/zh-hans',
      'zh-Hant': '/zh-hant',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.pokewordle.app',
    title: 'Poke Wordle - Guess the Pokémon Game',
    description: 'Test your Pokémon knowledge with Poke Wordle! Guess the Pokémon based on its attributes, stats, abilities, evolution, and more.',
    siteName: 'Poke Wordle',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Poke Wordle - Guess the Pokémon Game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Poke Wordle - Guess the Pokémon Game',
    description: 'Test your Pokémon knowledge with Poke Wordle! Guess the Pokémon based on its attributes, stats, abilities, evolution, and more.',
    images: ['/images/twitter-image.png'],
    creator: '@pokewordle',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
    other: {
      'msvalidate.01': 'your-bing-verification-code',
      'baidu-site-verification': 'your-baidu-verification-code',
    },
  },
  category: 'games',
  classification: 'Game',
  referrer: 'origin-when-cross-origin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Poke Wordle" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `,
              }}
            />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Poke Wordle",
              "description": "Test your Pokémon knowledge with Poke Wordle! Guess the Pokémon based on its attributes, stats, abilities, evolution, and more.",
              "url": "https://www.pokewordle.app",
              "applicationCategory": "Game",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "Poke Wordle Team"
              },
              "inLanguage": ["en", "ja", "fr", "de", "it", "es", "ko", "zh-Hans", "zh-Hant"],
              "genre": "Puzzle Game",
              "keywords": "pokemon, wordle, game, puzzle, guess, pokemon game, pokemon quiz",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1250",
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        {children}
        <CookieConsentWrapper />
      </body>
    </html>
  );
} 