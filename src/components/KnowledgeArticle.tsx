'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { KNOWLEDGE_SUPPORTED_LOCALES, KnowledgeArticle as KnowledgeArticleType, KnowledgeData } from '@/config/knowledge';
import Link from 'next/link';
import knowledgeDataRaw from '@/data/knowledge_data.json';

const knowledgeData = knowledgeDataRaw as KnowledgeData;

interface KnowledgeArticleProps {
  article: KnowledgeArticleType;
  locale: string;
}

export default function KnowledgeArticle({ article, locale }: KnowledgeArticleProps) {
  const t = useTranslations();
  const currentLocale = useLocale();
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [randomArticle, setRandomArticle] = useState<KnowledgeArticleType | null>(null);

  // Generate the correct href for knowledge page
  const knowledgeHref = currentLocale === 'en' ? '/knowledge' : `/${currentLocale}/knowledge`;

  const breadcrumbItems = [
    {
      label: t('knowledge.title'),
      href: knowledgeHref,
      current: false
    },
    {
      label: article.title,
      current: true
    }
  ];

  // Get random article from the same locale (excluding current article)
  useEffect(() => {
    const articles = knowledgeData[locale as keyof KnowledgeData] || [];
    const otherArticles = articles.filter(a => a.id !== article.id);
    
    if (otherArticles.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherArticles.length);
      setRandomArticle(otherArticles[randomIndex]);
    } else {
      setRandomArticle(null);
    }
  }, [article.id, locale]);

  useEffect(() => {
    const loadArticleContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch the server-rendered HTML content from the API
        const encodedSlug = encodeURIComponent(article.slug);
        const response = await fetch(`/api/knowledge/${locale}/${encodedSlug}`);
        if (!response.ok) {
          throw new Error(`Failed to load article: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setHtmlContent(data.html);
      } catch (err) {
        console.error('Error loading article content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setIsLoading(false);
      }
    };

    loadArticleContent();
  }, [article.slug, locale]);

  // Generate random article link
  const getRandomArticleHref = () => {
    if (!randomArticle) return '';
    
    const encodedSlug = encodeURIComponent(randomArticle.slug);
    return currentLocale === 'en' 
      ? `/knowledge/${encodedSlug}` 
      : `/${currentLocale}/knowledge/${encodedSlug}`;
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
      
      <main className="w-screen flex-1 container-responsive section-padding">
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
              {new Date(article.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          
          {/* Article Content */}
          <div className="card card-padding mb-8">
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading article...</p>
              </div>
            )}
            
            {error && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-red-600 mb-4">Failed to load article</p>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            )}
            
            {!isLoading && !error && htmlContent && (
              <div 
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}
          </div>
          
          {/* Random Article Link - Only show if there are other articles */}
          {randomArticle && (
            <div className="mb-8">
              <Link
                href={getRandomArticleHref()}
                className="inline-flex items-center text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('knowledge.readNext') || 'Read Next'}: {randomArticle.title}
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 