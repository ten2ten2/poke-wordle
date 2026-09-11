'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { KnowledgeData, isKnowledgeSupported } from '@/config/knowledge';
import knowledgeDataRaw from '@/data/knowledge_data.json';

const knowledgeData = knowledgeDataRaw as KnowledgeData;

export default function RandomKnowledge() {
  const locale = useLocale();
  const t = useTranslations();

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

  return (
    <div className="py-5">
      <div className="container-responsive px-4 py-2">
        <Link
          href={href}
          className="block text-center text-sm text-gray-500 hover:text-red-700 transition-colors"
        >
          <span className="font-medium">{t('knowledge.randomPrefix')}</span>
          <span className="hover:underline">{article.title}</span>
        </Link>
      </div>
    </div>
  );
}
