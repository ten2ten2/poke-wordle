'use client';

import { useLocale, useTranslations } from 'next-intl';
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
  
  const t = useTranslations('knowledge');

  // Get articles for current locale
  const articles = knowledgeData[locale as keyof KnowledgeData] || [];
  
  if (articles.length === 0) {
    return null;
  }

  // Select a random article (use a fixed seed for SSR consistency)
  const randomIndex = Math.floor(Math.random() * articles.length);
  const article = articles[randomIndex];
  
  // Generate the correct href
  const encodedSlug = encodeURIComponent(article.slug);
  const href = locale === 'en' 
    ? `/knowledge/${encodedSlug}` 
    : `/${locale}/knowledge/${encodedSlug}`;

  return (
    <div className="bg-blue-50 border-b border-blue-100">
      <div className="container-responsive px-4 py-2">
        <Link 
          href={href}
          className="block text-center text-sm text-blue-700 hover:text-blue-800 transition-colors duration-200"
        >
          <span className="font-medium">{t('randomPrefix')}</span>
          <span className="hover:underline">{article.title}</span>
        </Link>
      </div>
    </div>
  );
} 