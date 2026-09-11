'use client';

import { Description, DialogTitle } from '@headlessui/react';
import Modal from './Modal';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { localePath } from '@/i18n/routing';
import { KnowledgeArticle } from '@/config/knowledge';

interface LanguageSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  availableLocales?: string[]; // Optional prop to filter available languages
  currentArticle?: KnowledgeArticle; // Current knowledge article if on article page
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

export default function LanguageSwitcher({
  isOpen,
  onClose,
  availableLocales,
  currentArticle,
}: LanguageSwitcherProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();

  // Filter languages based on availableLocales prop, or show all if not provided
  const filteredLanguages = availableLocales
    ? languages.filter((lang) => availableLocales.includes(lang.code))
    : languages;

  const languageHref = (newLocale: string) => {
    if (newLocale === locale) return pathname;
    let path =
      locale === 'en' ? pathname : pathname.slice(locale.length + 1) || '/';
    if (currentArticle) {
      const translated = currentArticle.translations?.[newLocale];
      path = translated
        ? `/knowledge/${encodeURIComponent(translated.slug)}`
        : '/knowledge';
    }
    return localePath(newLocale, path);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        <header className="flex justify-between items-center mb-4">
          <DialogTitle
            as="h2"
            id="language-switcher-title"
            className="text-lg font-medium leading-6 text-foreground"
          >
            {t('navbar.language')}
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label={t('common.close') || 'Close dialog'}
            title={t('common.close')}
          >
            <XMarkIcon aria-hidden="true" />
          </button>
        </header>

        <div>
          <Description id="language-switcher-description" className="sr-only">
            {t('navbar.languageDescription')}
          </Description>
          <nav aria-label={t('navbar.language')}>
            <ul className="space-y-2" role="list">
              {filteredLanguages.map((language) => (
                <li key={language.code}>
                  <Link
                    href={languageHref(language.code)}
                    hrefLang={language.code}
                    prefetch={false}
                    onNavigate={(event) => {
                      if (language.code === locale) event.preventDefault();
                      onClose();
                    }}
                    className="button-link btn-option w-full justify-start text-left"
                    aria-current={locale === language.code ? 'page' : undefined}
                    aria-label={t('navbar.switchLanguage', { language: language.name })}
                    title={t('navbar.switchLanguage', { language: language.name })}
                  >
                    <span lang={language.code}>{language.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </Modal>
  );
}
