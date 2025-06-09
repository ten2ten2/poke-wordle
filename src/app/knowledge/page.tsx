import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Metadata } from 'next';
import KnowledgeArchive from '@/components/KnowledgeArchive';
import { KNOWLEDGE_SUPPORTED_LOCALES } from '@/config/knowledge';

// Generate language alternates dynamically from supported locales
const generateLanguageAlternates = (): Record<string, string> => {
  const languages: Record<string, string> = {};

  KNOWLEDGE_SUPPORTED_LOCALES.forEach(locale => {
    const langCode = locale === 'zh-hans' ? 'zh-Hans' :
      locale === 'zh-hant' ? 'zh-Hant' :
        locale;
    const langUrl = locale === 'en' ? '/knowledge' : `/${locale}/knowledge`;
    languages[langCode] = langUrl;
  });

  return languages;
};

export const metadata: Metadata = {
  title: 'Knowledge Base - Poke Wordle',
  description: 'Learn more about Pokémon and improve your game skills with our comprehensive knowledge base. Tips, strategies, and Pokémon information to help you become a better guesser.',
  keywords: [
    'pokemon knowledge',
    'pokemon tips',
    'legends z-a',
    'pokemon game',
    'ptcg',
    'nintendo',
    'pokemon go',
    'pokemon training card game',
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
    languages: generateLanguageAlternates(),
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
