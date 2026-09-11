import { getTranslations } from 'next-intl/server';
import Breadcrumb from '@/components/Breadcrumb';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import {
  KNOWLEDGE_SUPPORTED_LOCALES,
  KnowledgeArticle as KnowledgeArticleType,
  KnowledgeData,
} from '@/config/knowledge';
import Link from 'next/link';
import knowledgeDataRaw from '@/data/knowledge_data.json';
import MdxContent from '@/components/MdxContent';
import { Suspense } from 'react';

const knowledgeData = knowledgeDataRaw as KnowledgeData;

interface KnowledgeArticleProps {
  article: KnowledgeArticleType;
  locale: string;
}

export default async function KnowledgeArticle({
  article,
  locale,
}: KnowledgeArticleProps) {
  const t = await getTranslations({ locale, namespace: 'knowledge' });

  // Generate the correct href for knowledge page
  const knowledgeHref = locale === 'en' ? '/knowledge' : `/${locale}/knowledge`;

  const breadcrumbItems = [
    {
      label: t('title'),
      href: knowledgeHref,
      current: false,
    },
    {
      label: article.title,
      current: true,
    },
  ];

  // Get random article from the same locale (excluding current article)
  const articles = knowledgeData[locale as keyof KnowledgeData] || [];
  const otherArticles = articles.filter((a) => a.id !== article.id);
  const randomArticle = otherArticles.length > 0 ? otherArticles[0] : null;

  // Generate random article link
  const getRandomArticleHref = () => {
    if (!randomArticle) return '';

    const encodedSlug = encodeURIComponent(randomArticle.slug);
    return locale === 'en'
      ? `/knowledge/${encodedSlug}`
      : `/${locale}/knowledge/${encodedSlug}`;
  };

  return (
    <div className="min-h-screen-safe bg-gray-50 flex flex-col safe-all">
      {/* 使用自定义 Navbar，传递当前文章信息 */}
      <Navbar
        showAbout={false}
        showSettings={false}
        availableLocales={[...KNOWLEDGE_SUPPORTED_LOCALES]}
        currentArticle={article}
      />

      <main className="w-full flex-1 container-responsive section-padding">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Article Header */}
          <div className="card card-padding mb-8">
            <h1 className="text-responsive-2xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            <div className="text-responsive-sm text-gray-500">
              {new Date(article.createdAt).toLocaleDateString(
                locale === 'en' ? 'en-US' : locale,
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'UTC',
                },
              )}
            </div>
          </div>

          {/* Article Content */}
          <section className="card card-padding mb-8">
            <div className="prose prose-gray max-w-none [&_a]:text-red-400 [&_a:hover]:text-red-600 [&_a]:transition-colors [&_img]:inline [&_img]:mx-0 [&_img]:my-0 [&_img]:w-auto [&_img]:h-[2em]">
              <Suspense
                fallback={
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading article...</p>
                  </div>
                }
              >
                <MdxContent locale={locale} slug={article.slug} />
              </Suspense>
            </div>
          </section>

          {/* Random Article Link - Only show if there are other articles */}
          {randomArticle && (
            <div className="mb-8">
              <Link
                href={getRandomArticleHref()}
                className="inline-flex items-center text-red-400 hover:text-red-600 transition-colors"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {t('readNext') || 'Read Next'}: {randomArticle.title}
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
