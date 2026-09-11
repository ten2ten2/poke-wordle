'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRightIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { type KnowledgeArticle, isKnowledgeSupported, knowledgeData } from '@/config/knowledge';
import { useHydrated } from '@/hooks/useHydrated';

export default function RandomKnowledge() {
  const locale = useLocale();
  const hydrated = useHydrated();

  if (!isKnowledgeSupported(locale)) {
    return null;
  }

  const articles = knowledgeData[locale];

  if (articles.length === 0) {
    return null;
  }

  // Hydrate the server's first article, then select once for this page visit.
  return <KnowledgeBanner key={`${locale}-${hydrated}`} articles={articles} randomize={hydrated} />;
}

function KnowledgeBanner({ articles, randomize }: { articles: KnowledgeArticle[]; randomize: boolean }) {
  const locale = useLocale();
  const t = useTranslations();
  const [article] = useState(() => articles[randomize ? Math.floor(Math.random() * articles.length) : 0]);

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
        <QuestionMarkCircleIcon className="size-5 shrink-0 text-accent-text" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="font-semibold text-accent-text">{t('knowledge.randomPrefix')}</span>
          <span>{article.title}</span>
        </span>
        <ArrowRightIcon className="size-4 shrink-0 text-accent-text" aria-hidden="true" />
      </Link>
    </div>
  );
}
