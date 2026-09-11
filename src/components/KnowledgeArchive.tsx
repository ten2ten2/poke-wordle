'use client';

import { useTranslations, useLocale } from 'next-intl';
import { ArrowRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import Pokeball from '@/components/Pokeball';
import { KNOWLEDGE_SUPPORTED_LOCALES, KnowledgeData, knowledgeData } from '@/config/knowledge';

export default function KnowledgeArchive() {
  const t = useTranslations();
  const locale = useLocale();
  const articles = knowledgeData[locale as keyof KnowledgeData] || [];
  const prefix = locale === 'en' ? '' : `/${locale}`;

  return (
    <div className="min-h-screen-safe bg-gray-50 flex flex-col safe-all">
      <Navbar
        showAbout={false}
        showSettings={false}
        availableLocales={[...KNOWLEDGE_SUPPORTED_LOCALES]}
      />
      <main className="w-full flex-1 container-responsive section-padding">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <Breadcrumb items={[{ label: t('knowledge.title'), current: true }]} />
          <section className="card card-padding" aria-labelledby="knowledge-heading">
            <div className="border-b border-gray-100 pb-4 mb-4">
              <h2 id="knowledge-heading" className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
                {t('knowledge.title')}
              </h2>
              <p className="text-base text-gray-600">{t('knowledge.description')}</p>
            </div>
            {articles.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {articles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`${prefix}/knowledge/${encodeURIComponent(article.slug)}`}
                      className="knowledge-list-link"
                    >
                      <Pokeball className="size-6 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold">{article.title}</h3>
                        <time dateTime={article.createdAt} className="text-sm text-gray-500">
                          {new Date(article.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : locale, {
                            year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
                          })}
                        </time>
                      </div>
                      <ArrowRightIcon className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <BookOpenIcon className="mx-auto size-12 text-gray-400 mb-4" aria-hidden="true" />
                <p className="text-base text-gray-600 max-w-md mx-auto">{t('knowledge.comingSoon')}</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
