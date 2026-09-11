import { notFound } from 'next/navigation';

const articles = {
  'en/late-bloomers-pokemon': () =>
    import('@/data/knowledge/en/late-bloomers-pokemon.mdx'),
  'ja/大器晩成なポケモン': () =>
    import('@/data/knowledge/ja/大器晩成なポケモン.mdx'),
  'zh-hans/大器晚成的宝可梦': () =>
    import('@/data/knowledge/zh-hans/大器晚成的宝可梦.mdx'),
  'zh-hant/大器晚成的寶可夢': () =>
    import('@/data/knowledge/zh-hant/大器晚成的寶可夢.mdx'),
};

export default async function MdxContent({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}) {
  const load = articles[`${locale}/${slug}` as keyof typeof articles];
  if (!load) notFound();
  const { default: Content } = await load();
  return <Content />;
}
