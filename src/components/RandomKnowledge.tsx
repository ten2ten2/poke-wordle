'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { KnowledgeData, isKnowledgeSupported } from '@/config/knowledge';
import knowledgeDataRaw from '@/data/knowledge_data.json';

const knowledgeData = knowledgeDataRaw as KnowledgeData;

export default function RandomKnowledge() {
  const locale = useLocale();

  // Check if current locale supports knowledge
  if (!isKnowledgeSupported(locale)) {
    return null;
  }

  // Get articles for current locale
  const articles = knowledgeData[locale as keyof KnowledgeData] || [];

  if (articles.length === 0) {
    return null;
  }

  // Keep the featured article consistent between server rendering and hydration.
  const article = articles[0];

  // Generate the correct href
  const encodedSlug = encodeURIComponent(article.slug);
  const href =
    locale === 'en'
      ? `/knowledge/${encodedSlug}`
      : `/${locale}/knowledge/${encodedSlug}`;

  // Get localized prefix based on locale
  const getPrefix = () => {
    switch (locale) {
      case 'zh-hans':
        return '宝可梦问答：';
      case 'zh-hant':
        return '寶可夢問答：';
      case 'ja':
        return 'ポケモンQ&A：';
      case 'en':
      default:
        return 'Pokémon Q&A: ';
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-100">
      <div className="container-responsive px-4 py-2">
        <Link
          href={href}
          className="block text-center text-sm text-yellow-700 hover:text-yellow-800 transition-colors duration-200"
        >
          <span className="font-medium">{getPrefix()}</span>
          <span className="hover:underline">{article.title}</span>
        </Link>
      </div>
    </div>
  );
}
