'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useHydrated } from '@/hooks/useHydrated';
import { localePath } from '@/i18n/routing';
import { setCookieConsentStatus, useCookieConsent } from '@/lib/consent';

interface CookieConsentProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function CookieConsent({
  onAccept,
  onDecline,
}: CookieConsentProps) {
  const t = useTranslations('cookieConsent');
  const locale = useLocale();
  const hydrated = useHydrated();
  const consent = useCookieConsent();
  const [dismissed, setDismissed] = useState(false);
  if (!hydrated || consent || dismissed) return null;

  function choose(value: 'accepted' | 'declined') {
    setCookieConsentStatus(value);
    setDismissed(true);
    if (value === 'accepted') onAccept?.();
    else onDecline?.();
  }

  return (
    <aside
      aria-label={t('title')}
      className="fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-line shadow-lg safe-all"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-sm font-medium text-foreground mb-1">
            {t('title')}
          </h2>
          <p className="text-sm text-secondary">
            {t('description')}{' '}
            <Link
              href={localePath(locale, '/privacy-and-terms')}
              title={t('privacyAndTerms')}
              className="text-accent-text underline"
            >
              {t('learnMore')}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => choose('declined')} className="btn-secondary">
            {t('decline')}
          </button>
          <button onClick={() => choose('accepted')} className="btn-primary">
            {t('accept')}
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label={t('close')}
            className="btn-icon"
          >
            <XMarkIcon aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
