import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import GamePage from '@/app/[locale]/page';

export default async function RootPage() {
  // This is the English version at root path
  const messages = await getMessages({ locale: 'en' });

  return (
    <NextIntlClientProvider messages={messages} locale="en">
      <GamePage />
    </NextIntlClientProvider>
  );
} 