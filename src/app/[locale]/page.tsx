import { setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import Game from '@/components/Game';
import RandomKnowledge from '@/components/RandomKnowledge';
import JsonLd from '@/components/mdx/JsonLd';
import { websiteSchema } from '@/config/seo';
import { knowledgeData } from '@/config/knowledge';
import { routing } from '@/i18n/routing';

export default async function GamePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <>
    {locale === 'en' && <JsonLd data={websiteSchema} />}
    <Game>
      <RandomKnowledge articles={knowledgeData[locale].map(({ id, title, slug }) => ({ id, title, slug }))} />
    </Game>
  </>;
}
