'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useCookieConsent } from '@/lib/consent';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics({
  measurementId,
}: {
  measurementId: string;
}) {
  const consent = useCookieConsent();

  useEffect(() => {
    window.gtag?.('consent', 'update', {
      analytics_storage: consent === 'accepted' ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }, [consent]);

  if (consent !== 'accepted') return null;

  return (
    <Script
      id="google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      strategy="afterInteractive"
      onReady={() => {
        window.dataLayer ??= [];
        window.gtag ??= (...args: unknown[]) => {
          window.dataLayer.push(args);
        };
        window.gtag('js', new Date());
        window.gtag('consent', 'default', {
          analytics_storage: 'granted',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        });
        window.gtag('config', measurementId);
      }}
    />
  );
}
