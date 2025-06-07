'use client';

import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { savePreferredLocale } from '@/lib/storage';

interface LanguageSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  availableLocales?: string[]; // Optional prop to filter available languages
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'zh-hans', name: '简体中文' },
  { code: 'zh-hant', name: '繁體中文' },
  { code: 'ko', name: '한국어' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'es', name: 'Español' },
];

export default function LanguageSwitcher({ isOpen, onClose, availableLocales }: LanguageSwitcherProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // Filter languages based on availableLocales prop, or show all if not provided
  const filteredLanguages = availableLocales 
    ? languages.filter(lang => availableLocales.includes(lang.code))
    : languages;

  const handleLanguageChange = (newLocale: string) => {
    // Save the preferred locale to localStorage
    savePreferredLocale(newLocale);
    
    // Navigate to the new locale
    if (newLocale === 'en') {
      // For English, use root path
      let newPath;
      if (locale === 'en') {
        // Already on English, keep current path
        newPath = pathname;
      } else {
        // Remove locale prefix for English
        newPath = pathname.replace(`/${locale}`, '') || '/';
      }
      router.push(newPath);
    } else {
      // For other languages, use locale prefix
      let currentPath;
      if (locale === 'en') {
        // Currently on English (root path), use current pathname
        currentPath = pathname;
      } else {
        // Remove current locale prefix
        currentPath = pathname.replace(`/${locale}`, '') || '/';
      }
      const newPath = `/${newLocale}${currentPath === '/' ? '' : currentPath}`;
      router.push(newPath);
      }
    }
    
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-10" 
        onClose={onClose}
        aria-labelledby="language-switcher-title"
        aria-describedby="language-switcher-description"
      >
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <header className="flex justify-between items-center mb-4">
                  <DialogTitle 
                    as="h2" 
                    id="language-switcher-title"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {t('navbar.language')}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-300"
                    aria-label={t('common.close') || 'Close dialog'}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </header>

                <main>
                  <p 
                    id="language-switcher-description" 
                    className="sr-only"
                  >
                    Select your preferred language from the list below
                  </p>
                  <nav aria-label="Language selection">
                    <ul className="space-y-2" role="list">
                      {filteredLanguages.map((language) => (
                        <li key={language.code}>
                          <button
                            type="button"
                            onClick={() => handleLanguageChange(language.code)}
                            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                              locale === language.code
                                ? 'bg-red-100 text-red-900'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                            aria-current={locale === language.code ? 'true' : 'false'}
                            aria-label={`Switch to ${language.name}`}
                          >
                            <span aria-hidden="true">{language.name}</span>
                            {locale === language.code && (
                              <span className="sr-only"> (current language)</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </main>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 