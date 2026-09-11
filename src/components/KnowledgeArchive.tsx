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
    <div className="min-h-screen-safe bg-page flex flex-col safe-all">
      <Navbar
        showAbout={false}
        showSettings={false}
        availableLocales={[...KNOWLEDGE_SUPPORTED_LOCALES]}
      />
      <main className="w-full flex-1 container-responsive section-padding">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <Breadcrumb items={[{ label: t('knowledge.title'), current: true }]} />
          <section className="card card-padding" aria-labelledby="knowledge-heading">
            <div className="border-b border-line-subtle pb-4 mb-4">
              <h1 id="knowledge-heading" className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                {t('knowledge.title')}
              </h1>
              <p className="text-base text-secondary">{t('knowledge.description')}</p>
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
                        <h2 className="text-base font-semibold">{article.title}</h2>
                        <p className="text-sm text-secondary mt-1">{article.description}</p>
                        <time dateTime={article.createdAt} className="text-sm text-muted">
                          {new Date(article.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : locale, {
                            year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
                          })}
                        </time>
                      </div>
                      <ArrowRightIcon className="size-4 shrink-0 text-muted" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <BookOpenIcon className="mx-auto size-12 text-muted mb-4" aria-hidden="true" />
                <p className="text-base text-secondary max-w-md mx-auto">{t('knowledge.comingSoon')}</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
