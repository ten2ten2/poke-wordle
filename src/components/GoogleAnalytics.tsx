'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useHydrated } from '@/hooks/useHydrated';
import { getCookieConsentStatus, useCookieConsent } from '@/lib/consent';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

const configuredIds = new Set<string>();
const deniedAds = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
} as const;

function clearAnalyticsCookies() {
  const domains = window.location.hostname.split('.');
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.trim().split('=')[0];
    if (!/^_ga(?:_|$)/.test(name)) continue;
    const expired = `${name}=; Max-Age=0; Path=/`;
    document.cookie = expired;
    // GA can set cookies on the current host or a parent domain.
    for (let index = 0; index < domains.length - 1; index++) {
      document.cookie = `${expired}; Domain=${domains.slice(index).join('.')}`;
    }
  }
}

export default function GoogleAnalytics({
  measurementId,
}: {
  measurementId: string;
}) {
  const consent = useCookieConsent();
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    const declined = consent === 'declined';
    // Stop collection entirely on opt-out, including cookieless consent pings.
    window[`ga-disable-${measurementId}`] = declined;
    window.gtag?.('consent', 'update', {
      analytics_storage: declined ? 'denied' : 'granted',
      ...deniedAds,
    });
    if (declined) clearAnalyticsCookies();
  }, [consent, hydrated, measurementId]);

  // Read the saved preference before loading the tag on a returning visit.
  if (!hydrated || consent === 'declined') return null;

  return (
    <Script
      id="google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      strategy="afterInteractive"
      onReady={() => {
        // The user may opt out while the external script is still loading.
        const declined = getCookieConsentStatus() === 'declined';
        window[`ga-disable-${measurementId}`] = declined;
        if (declined || configuredIds.has(measurementId)) return;
        window.dataLayer ??= [];
        window.gtag ??= function () {
          // Google tag commands require IArguments, not a rest-parameter array.
          // eslint-disable-next-line prefer-rest-params
          window.dataLayer.push(arguments);
        };
        window.gtag('consent', 'default', {
          analytics_storage: 'granted',
          ...deniedAds,
        });
        window.gtag('js', new Date());
        // Enhanced measurement tracks history changes; do not also send manual page views.
        window.gtag('config', measurementId);
        configuredIds.add(measurementId);
      }}
    />
  );
}
