import { notFound } from 'next/navigation';

import knowledgeLoaders from '@/data/knowledge-loaders';

export default async function MdxContent({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}) {
  const load = knowledgeLoaders[`${locale}/${slug}`];
  if (!load) notFound();
  const { default: Content } = await load();
  return <Content />;
}
