'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  // Generate the correct href for privacy-and-terms page
  const privacyHref = locale === 'en' ? '/privacy-and-terms' : `/${locale}/privacy-and-terms`;

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto safe-bottom">
      <div className="container-responsive">
        <div className="py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-center sm:text-left">
              <p className="text-responsive-sm text-gray-500">
                © 2025 pokewordle.app
              </p>
            </div>
            
            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Link
                href={privacyHref}
                title={t('footer.privacyAndTerms')}
                className="text-responsive-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                {t('footer.privacyAndTerms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 