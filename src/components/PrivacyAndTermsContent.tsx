'use client';

import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import Footer from '@/components/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import Navbar from '@/components/Navbar';

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

export default function PrivacyAndTermsContent() {
  const t = useTranslations('privacyAndTerms');

  return (
    <div className="min-h-screen-safe bg-page flex flex-col safe-all">
      <Navbar showAbout={false} showSettings={false} />
      <main className="w-full flex-1 container-responsive section-padding">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <Breadcrumb items={[{ label: t('title'), current: true }]} />
          <article className="card card-padding" aria-labelledby="privacy-and-terms-title">
            <header className="border-b border-line-subtle pb-4 mb-4 sm:pb-6 sm:mb-6">
              <h1 id="privacy-and-terms-title" className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                {t('title')}
              </h1>
            </header>
            <div className="divide-y divide-gray-100">
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
