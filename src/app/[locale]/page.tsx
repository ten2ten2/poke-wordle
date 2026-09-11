import { setRequestLocale } from 'next-intl/server';
import Game from '@/components/Game';

export default async function GamePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Game />;
}
