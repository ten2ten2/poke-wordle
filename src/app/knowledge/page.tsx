import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Metadata } from 'next';
import KnowledgeArchive from '@/components/KnowledgeArchive';

export const metadata: Metadata = {
  title: 'Knowledge Base - Poke Wordle',
  description: 'Learn more about Pokémon and improve your game skills with our comprehensive knowledge base. Tips, strategies, and Pokémon information to help you become a better guesser.',
  keywords: [
    'pokemon knowledge',
    'pokemon tips',
    'poke wordle guide',
    'pokemon game strategy',
    'pokemon learning',
    'pokemon database',
    'pokemon information',
    'game tips',
    'pokemon facts',
    'pokemon guide'
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Knowledge - Poke Wordle',
    description: 'Pokémon knowledge that you might have interests in',
    url: 'https://www.pokewordle.app/knowledge',
    type: 'website',
    siteName: 'Poke Wordle',
  },
  twitter: {
    card: 'summary',
    title: 'Knowledge - Poke Wordle',
    description: 'Pokémon knowledge that you might have interests in',
  },
  alternates: {
    canonical: '/knowledge',
    languages: {
      'en': '/knowledge',
      'ja': '/ja/knowledge',
      'zh-Hans': '/zh-hans/knowledge',
      'zh-Hant': '/zh-hant/knowledge',
    },
  },
};

export default async function RootKnowledgePage() {
  // This is the English version at root path
  const messages = await getMessages({ locale: 'en' });

  return (
    <NextIntlClientProvider messages={messages} locale="en">
      <KnowledgeArchive />
    </NextIntlClientProvider>
  );
}
