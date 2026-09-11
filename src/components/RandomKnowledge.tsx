'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRightIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
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
    <div className="container-responsive w-full py-2">
      <Link
        href={href}
        className="knowledge-banner"
      >
        <QuestionMarkCircleIcon className="size-5 shrink-0 text-red-600" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="font-semibold text-red-700">{t('knowledge.randomPrefix')}</span>
          <span>{article.title}</span>
        </span>
        <ArrowRightIcon className="size-4 shrink-0 text-red-600" aria-hidden="true" />
      </Link>
    </div>
  );
}
