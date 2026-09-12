import { Fragment } from 'react';
import { getTranslations } from 'next-intl/server';
import ContentLayout from '@/components/ContentLayout';

const sections = [
  {
    key: 'privacyPolicy',
    topics: [
      { key: 'informationCollection', list: true },
      { key: 'dataStorage', list: true },
      { key: 'cookies', list: false },
      { key: 'thirdParty', list: false },
      { key: 'dataRights', list: true },
    ],
  },
  {
    key: 'termsOfService',
    topics: [
      { key: 'gameContent', list: false },
      { key: 'userConduct', list: true },
      { key: 'disclaimer', list: false },
      { key: 'modifications', list: false },
      { key: 'contact', list: false },
    ],
  },
] as const;

export default async function PrivacyAndTermsContent() {
  const t = await getTranslations('privacyAndTerms');

  return (
    <ContentLayout breadcrumbs={[{ label: t('title'), current: true }]}>
      <article className="card card-padding" aria-labelledby="privacy-and-terms-title">
        <header className="border-b border-line-subtle pb-4 mb-4 sm:pb-6 sm:mb-6">
          <h1 id="privacy-and-terms-title" className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
            {t('title')}
          </h1>
        </header>
        <div className="divide-y divide-line-subtle">
          {sections.map(({ key, topics }) => (
            <section key={key} aria-labelledby={`${key}-title`} className="prose content-prose max-w-none py-6 first:pt-0 last:pb-0 sm:py-8">
              <h2 id={`${key}-title`}>{t(`${key}.title`)}</h2>
              <p>{t(`${key}.introduction`)}</p>
              {topics.map((topic) => (
                <Fragment key={topic.key}>
                  <h3>{t(`${key}.${topic.key}.title`)}</h3>
                  <p>{t(`${key}.${topic.key}.description`)}</p>
                  {topic.list && (
                    <ul>
                      {t.raw(`${key}.${topic.key}.items`).map((item: string) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </Fragment>
              ))}
            </section>
          ))}
        </div>
      </article>
    </ContentLayout>
  );
}
