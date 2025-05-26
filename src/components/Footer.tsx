'use client';

import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto safe-bottom">
      <div className="container-responsive">
        <div className="py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-center sm:text-left">
              <p className="text-responsive-sm text-gray-500">
                © 2024 Poke Wordle. {t('footer.allRightsReserved')}
              </p>
            </div>
            
            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <a
                href="https://github.com/your-repo/poke-wordle"
                target="_blank"
                rel="noopener noreferrer"
                className="text-responsive-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                {t('footer.github')}
              </a>
              <a
                href="/privacy"
                className="text-responsive-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                {t('footer.privacy')}
              </a>
              <a
                href="/terms"
                className="text-responsive-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                {t('footer.terms')}
              </a>
            </div>
          </div>
          
          {/* Attribution */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-center text-xs sm:text-sm text-gray-400">
              {t('footer.pokemonAttribution')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 