'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { isKnowledgeSupported } from '@/config/knowledge';

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  const prefix = locale === 'en' ? '' : `/${locale}`;

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto safe-bottom">
      <div className="container-responsive">
        <div className="py-2 pl-1 pr-2 sm:py-3 sm:pl-2 sm:pr-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            {/* Copyright */}
            <div className="text-center sm:text-left">
              <p className="text-responsive-sm text-gray-500">
                © 2025–2026 pokewordle.app
              </p>
            </div>
            
            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {isKnowledgeSupported(locale) && (
                <Link href={`${prefix}/knowledge`} className="footer-link">
                  {t('knowledge.title')}
                </Link>
              )}
              <Link
                href={`${prefix}/privacy-and-terms`}
                title={t('footer.privacyAndTerms')}
                className="footer-link"
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
