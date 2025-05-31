import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Metadata } from 'next';
import PrivacyAndTermsPage from '@/app/[locale]/privacy-and-terms/page';

export const metadata: Metadata = {
  title: 'Privacy Policy & Terms - Poke Wordle',
  description: 'Read our privacy policy and terms of service for Poke Wordle. Learn how we protect your data, what we collect, and our game usage policies. Your privacy matters to us.',
  keywords: [
    'privacy policy',
    'terms of service',
    'data protection',
    'poke wordle',
    'pokemon game privacy',
    'user data',
    'game terms',
    'privacy rights',
    'data collection',
    'user agreement'
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Privacy Policy & Terms - Poke Wordle',
    description: 'Read our privacy policy and terms of service for Poke Wordle. Learn how we protect your data, what we collect, and our game usage policies.',
    url: 'https://www.pokewordle.app/privacy-and-terms',
    type: 'website',
    siteName: 'Poke Wordle',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy & Terms - Poke Wordle',
    description: 'Read our privacy policy and terms of service for Poke Wordle. Learn how we protect your data and our game usage policies.',
  },
  alternates: {
    canonical: '/privacy-and-terms',
    languages: {
      'en': '/privacy-and-terms',
      'ja': '/ja/privacy-and-terms',
      'fr': '/fr/privacy-and-terms',
      'de': '/de/privacy-and-terms',
      'it': '/it/privacy-and-terms',
      'es': '/es/privacy-and-terms',
      'ko': '/ko/privacy-and-terms',
      'zh-Hans': '/zh-hans/privacy-and-terms',
      'zh-Hant': '/zh-hant/privacy-and-terms',
    },
  },
};

export default async function RootPrivacyAndTermsPage() {
  // This is the English version at root path
  const messages = await getMessages({ locale: 'en' });

  return (
    <NextIntlClientProvider messages={messages} locale="en">
      <PrivacyAndTermsPage />
    </NextIntlClientProvider>
  );
} 