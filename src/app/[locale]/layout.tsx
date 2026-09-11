import '@/styles/globals.css';
import type { Metadata } from 'next';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import localFont from 'next/font/local';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import CookieConsent from '@/components/CookieConsent';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { localePath, routing } from '@/i18n/routing';
import { homeMetadata, pageAlternates, pageMetadata, SITE_URL } from '@/config/seo';

const inter = localFont({
  src: '../../../public/fonts/inter-latin-variable.woff2',
  variable: '--font-inter',
  weight: '400 700',
  display: 'swap',
});

const themeScript = readFileSync(path.join(process.cwd(), 'public/theme.js'), 'utf8');

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return {
    metadataBase: new URL(SITE_URL),
    icons: { icon: '/favicon.ico', apple: '/images/apple-touch-icon.png' },
    manifest: '/manifest.json',
    ...pageMetadata({ locale, ...homeMetadata[locale], path: localePath(locale), languages: pageAlternates('/') }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Props & { children: React.ReactNode }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <NextIntlClientProvider>
          {children}
          <CookieConsent />
          {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
            <GoogleAnalytics
              measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
            />
          )}
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
