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
  knowledgeArticlePath,
} from '@/config/knowledge';
import { absoluteUrl, SITE_NAME, SITE_URL } from '@/config/seo';
import JsonLd from '@/components/mdx/JsonLd';
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
  const relatedArticles = articles.filter((item) => item.id !== article.id).slice(0, 3);

  return (
    <div className="min-h-screen-safe bg-page flex flex-col safe-all">
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
            <JsonLd data={{
              '@context': 'https://schema.org', '@type': 'Article',
              headline: article.title, description: article.description,
              datePublished: article.createdAt, dateModified: article.updatedAt ?? article.createdAt,
              inLanguage: locale,
              mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(knowledgeArticlePath(locale, article.slug)) },
              author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
              publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
              ...(article.image ? { image: absoluteUrl(article.image) } : {}),
            }} />
            <header className="border-b border-line-subtle pb-4 mb-4 sm:pb-6 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                {article.title}
              </h1>
              <p className="text-base text-secondary mb-3">{article.description}</p>
              <time dateTime={article.createdAt} className="text-sm text-muted">
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
          {relatedArticles.length > 0 && (
            <nav aria-label={t('relatedArticles')} className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">{t('relatedArticles')}</h2>
              {relatedArticles.map((related) => (
                <Link key={related.id} href={knowledgeArticlePath(locale, related.slug)} className="knowledge-banner">
                  <span className="min-w-0 flex-1">{related.title}</span>
                  <ArrowRightIcon className="size-4 shrink-0 text-accent-text" aria-hidden="true" />
                </Link>
              ))}
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
