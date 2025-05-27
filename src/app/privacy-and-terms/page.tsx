import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Metadata } from 'next';
import PrivacyAndTermsPage from '@/app/[locale]/privacy-and-terms/page';

export const metadata: Metadata = {
  title: 'Privacy Policy & Terms of Service - Poke Wordle',
  description: 'Privacy policy and terms of service for Poke Wordle, the Pokémon guessing game. Learn about data collection, storage, and usage policies.',
  robots: {
    index: true,
    follow: true,
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