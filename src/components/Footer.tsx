'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useHydrated } from '@/hooks/useHydrated';
import { localePath } from '@/i18n/routing';
import { openCookiePreferences } from '@/lib/consent';

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  // Read the year after hydration so prerendered pages stay correct across years.
  const currentYear = useHydrated() ? new Date().getFullYear() : 2025;

  return (
    <footer className="bg-surface border-t border-line mt-auto safe-bottom">
      <div className="container-responsive">
        <div className="py-2 pl-1 pr-2 sm:py-3 sm:pl-2 sm:pr-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="text-center sm:text-left">
              <p className="text-responsive-sm text-muted">
                © 2025{currentYear > 2025 ? `–${currentYear}` : ''} pokewordle.app
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Link href={localePath(locale, '/knowledge')} title={t('knowledge.title')} className="footer-link">
                {t('knowledge.title')}
              </Link>
              <Link
                href={localePath(locale, '/privacy-and-terms')}
                title={t('footer.privacyAndTerms')}
                className="footer-link"
              >
                {t('footer.privacyAndTerms')}
              </Link>
              <button
                type="button"
                onClick={openCookiePreferences}
                title={t('cookieConsent.title')}
                className="btn-ghost footer-link px-0 font-normal"
              >
                {t('cookieConsent.title')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
