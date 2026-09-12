import { getTranslations } from 'next-intl/server';
import { ArrowRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import ContentLayout from '@/components/ContentLayout';
import Pokeball from '@/components/Pokeball';
import { knowledgeArticlePath, knowledgeData } from '@/config/knowledge';
import type { Locale } from '@/i18n/routing';

export default async function KnowledgeArchive({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  const articles = knowledgeData[locale];

  return (
    <ContentLayout breadcrumbs={[{ label: t('title'), current: true }]}>
      <section className="card card-padding" aria-labelledby="knowledge-heading">
        <div className="border-b border-line-subtle pb-4 mb-4">
          <h1 id="knowledge-heading" className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
            {t('title')}
          </h1>
          <p className="text-base text-secondary">{t('description')}</p>
        </div>
        {articles.length > 0 ? (
          <ul className="divide-y divide-line-subtle">
            {articles.map((article) => (
              <li key={article.id}>
                <Link
                  href={knowledgeArticlePath(locale, article.slug)}
                  title={article.title}
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
            <p className="text-base text-secondary max-w-md mx-auto">{t('comingSoon')}</p>
          </div>
        )}
      </section>
    </ContentLayout>
  );
}
