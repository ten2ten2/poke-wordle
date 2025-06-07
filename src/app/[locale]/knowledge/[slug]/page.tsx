import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KnowledgeArticle from '@/components/KnowledgeArticle';
import { isKnowledgeSupported, KNOWLEDGE_SUPPORTED_LOCALES, KnowledgeData } from '@/config/knowledge';
import knowledgeDataRaw from '@/data/knowledge_data.json';

const knowledgeData = knowledgeDataRaw as KnowledgeData;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Generate language alternates dynamically from supported locales
const generateLanguageAlternates = (locale: string, slug: string): Record<string, string> => {
  const languages: Record<string, string> = {
    'x-default': `/knowledge/${slug}`,
  };
  
  KNOWLEDGE_SUPPORTED_LOCALES.forEach(supportedLocale => {
    const langCode = supportedLocale === 'zh-hans' ? 'zh-Hans' : 
                     supportedLocale === 'zh-hant' ? 'zh-Hant' : 
                     supportedLocale;
    const langUrl = supportedLocale === 'en' ? `/knowledge/${slug}` : `/${supportedLocale}/knowledge/${slug}`;
    languages[langCode] = langUrl;
  });
  
  return languages;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  
  // Check if locale supports knowledge page
  if (!isKnowledgeSupported(locale)) {
    return {};
  }
  
  // Find the article in the locale's data
  const article = knowledgeData[locale as keyof KnowledgeData]?.find(item => item.slug === slug);
  
  if (!article) {
    return {};
  }
  
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  
  // Generate correct URLs for English vs other locales
  const canonicalUrl = locale === 'en' ? `/knowledge/${slug}` : `/${locale}/knowledge/${slug}`;
  const ogUrl = locale === 'en' ? `https://www.pokewordle.app/knowledge/${slug}` : `https://www.pokewordle.app/${locale}/knowledge/${slug}`;
  
  return {
    title: `${article.title} - ${t('title')} - Poke Wordle`,
    description: `Learn about ${article.title} in our comprehensive Pokémon knowledge base.`,
    keywords: [
      'pokemon knowledge',
      'pokemon tips',
      'poke wordle guide',
      'pokemon game strategy',
      article.title.toLowerCase()
    ],
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: generateLanguageAlternates(locale, slug),
    },
    openGraph: {
      title: `${article.title} - ${t('title')} - Poke Wordle`,
      description: `Learn about ${article.title} in our comprehensive Pokémon knowledge base.`,
      url: ogUrl,
      type: 'article',
      siteName: 'Poke Wordle',
      publishedTime: article.createdAt,
    },
    twitter: {
      card: 'summary',
      title: `${article.title} - ${t('title')} - Poke Wordle`,
      description: `Learn about ${article.title} in our comprehensive Pokémon knowledge base.`,
    },
  };
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  
  // Generate static params for all supported locales and their articles
  KNOWLEDGE_SUPPORTED_LOCALES.forEach(locale => {
    if (locale !== 'en') { // Skip English as it's handled by the root route
      const articles = knowledgeData[locale as keyof KnowledgeData] || [];
      articles.forEach(article => {
        params.push({
          locale,
          slug: article.slug,
        });
      });
    }
  });
  
  return params;
}

export default async function KnowledgeArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  
  // Check if locale supports knowledge page, return 404 if not
  if (!isKnowledgeSupported(locale)) {
    notFound();
  }
  
  // URL decode the slug to handle Chinese characters properly
  const decodedSlug = decodeURIComponent(slug);
  
  // Find the article in the locale's data
  const article = knowledgeData[locale as keyof KnowledgeData]?.find(item => item.slug === decodedSlug);
  
  if (!article) {
    notFound();
  }
  
  return <KnowledgeArticle article={article} locale={locale} />;
} 