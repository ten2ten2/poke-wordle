import { setRequestLocale } from 'next-intl/server';
import Game from '@/components/Game';
import JsonLd from '@/components/mdx/JsonLd';
import { websiteSchema } from '@/config/seo';

export default async function GamePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <>
    {locale === 'en' && <JsonLd data={websiteSchema} />}
    <Game />
  </>;
}
