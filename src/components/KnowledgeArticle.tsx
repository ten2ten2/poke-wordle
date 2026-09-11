import { getTranslations } from 'next-intl/server';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/Breadcrumb';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import {
  KNOWLEDGE_SUPPORTED_LOCALES,
  KnowledgeArticle as KnowledgeArticleType,
  KnowledgeData,
  knowledgeData,
} from '@/config/knowledge';
import Link from 'next/link';
import MdxContent from '@/components/MdxContent';
import { Suspense } from 'react';

interface KnowledgeArticleProps {
  article: KnowledgeArticleType;
  locale: string;
}

export default async function KnowledgeArticle({ article, locale }: KnowledgeArticleProps) {
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  const knowledgeHref = locale === 'en' ? '/knowledge' : `/${locale}/knowledge`;
  const articles = knowledgeData[locale as keyof KnowledgeData] || [];
  const nextArticle = articles.find((item) => item.id !== article.id);

  return (
    <div className="min-h-screen-safe bg-gray-50 flex flex-col safe-all">
      <Navbar
        showAbout={false}
        showSettings={false}
        availableLocales={[...KNOWLEDGE_SUPPORTED_LOCALES]}
        currentArticle={article}
      />
      <main className="w-full flex-1 container-responsive section-padding">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <Breadcrumb items={[
            { label: t('title'), href: knowledgeHref },
            { label: article.title, current: true },
          ]} />
          <article className="card card-padding">
            <header className="border-b border-gray-100 pb-4 mb-4 sm:pb-6 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
                {article.title}
              </h1>
              <time dateTime={article.createdAt} className="text-sm text-gray-500">
                {new Date(article.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : locale, {
                  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
                })}
              </time>
            </header>
            <div className="prose content-prose max-w-none">
              <Suspense fallback={
                <div className="flex justify-center py-8" aria-busy="true">
                  <span className="loading-spinner size-6" aria-hidden="true" />
                </div>
              }>
                <MdxContent locale={locale} slug={article.slug} />
              </Suspense>
            </div>
          </article>
          {nextArticle && (
            <Link href={`${knowledgeHref}/${encodeURIComponent(nextArticle.slug)}`} className="knowledge-banner">
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-red-700">{t('readNext')}: </span>
                {nextArticle.title}
              </span>
              <ArrowRightIcon className="size-4 shrink-0 text-red-600" aria-hidden="true" />
            </Link>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
