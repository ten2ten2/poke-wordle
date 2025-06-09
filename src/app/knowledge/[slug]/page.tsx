import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KnowledgeArticle from '@/components/KnowledgeArticle';
import { KNOWLEDGE_SUPPORTED_LOCALES, KnowledgeData } from '@/config/knowledge';
import knowledgeDataRaw from '@/data/knowledge_data.json';

const knowledgeData = knowledgeDataRaw as KnowledgeData;

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate language alternates dynamically from supported locales
const generateLanguageAlternates = (slug: string): Record<string, string> => {
  const languages: Record<string, string> = {};

  KNOWLEDGE_SUPPORTED_LOCALES.forEach(locale => {
    const langCode = locale === 'zh-hans' ? 'zh-Hans' :
      locale === 'zh-hant' ? 'zh-Hant' :
        locale;
    const langUrl = locale === 'en' ? `/knowledge/${slug}` : `/${locale}/knowledge/${slug}`;
    languages[langCode] = langUrl;
  });

  return languages;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // Find the article in English data
  const article = knowledgeData.en.find(item => item.slug === slug);

  if (!article) {
    return {};
  }

  return {
    title: `${article.title} - Knowledge - Poke Wordle`,
    description: `Learn about ${article.title} in our comprehensive Pokémon knowledge base.`,
    keywords: [
      'pokemon knowledge',
      'pokemon tips',
      'legends z-a',
      'pokemon game',
      'ptcg',
      'nintendo',
      'pokemon go',
      'pokemon training card game',
      article.title.toLowerCase()
    ],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${article.title} - Knowledge - Poke Wordle`,
      description: `Learn about ${article.title} in our comprehensive Pokémon knowledge base.`,
      url: `https://www.pokewordle.app/knowledge/${slug}`,
      type: 'article',
      siteName: 'Poke Wordle',
      publishedTime: article.createdAt,
    },
    twitter: {
      card: 'summary',
      title: `${article.title} - Knowledge - Poke Wordle`,
      description: `Learn about ${article.title} in our comprehensive Pokémon knowledge base.`,
    },
    alternates: {
      canonical: `/knowledge/${slug}`,
      languages: generateLanguageAlternates(slug),
    },
  };
}

export async function generateStaticParams() {
  // Generate static params for all English articles
  return knowledgeData.en.map((article) => ({
    slug: article.slug,
  }));
}

export default async function KnowledgeArticlePage({ params }: Props) {
  const { slug } = await params;

  // URL decode the slug to handle special characters properly
  const decodedSlug = decodeURIComponent(slug);

  // Find the article in English data
  const article = knowledgeData.en.find(item => item.slug === decodedSlug);

  if (!article) {
    notFound();
  }

  // This is the English version at root path
  const messages = await getMessages({ locale: 'en' });

  return (
    <NextIntlClientProvider messages={messages} locale="en">
      <KnowledgeArticle article={article} locale="en" />
    </NextIntlClientProvider>
  );
} 