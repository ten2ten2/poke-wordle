'use client';

import { useState, useSyncExternalStore } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Cog6ToothIcon,
  InformationCircleIcon,
  LanguageIcon,
} from '@heroicons/react/24/outline';
import { DynamicSettings, DynamicAbout } from './DynamicComponents';
import LanguageSwitcher from './LanguageSwitcher';
import { GameSettings } from '@/types/pokemon';
import Link from 'next/link';
import { KnowledgeArticle } from '@/config/knowledge';

interface NavbarProps {
  onSettingsChange?: (settings: GameSettings) => void;
  currentSettings?: GameSettings;
  showAbout?: boolean; // 是否显示 About 按钮
  showSettings?: boolean; // 是否显示设置按钮
  availableLocales?: string[]; // 可用的语言列表
  currentArticle?: KnowledgeArticle; // 当前知识文章（如果在文章页面）
}

function subscribeStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('poke-wordle-about', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('poke-wordle-about', callback);
  };
}

function hasSeenAbout(locale: string) {
  try {
    return localStorage.getItem(`hasSeenAbout_${locale}`) === 'true';
  } catch {
    return false;
  }
}

export default function Navbar({
  onSettingsChange,
  currentSettings,
  showAbout = true,
  showSettings = true,
  availableLocales,
  currentArticle,
}: NavbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const seenAbout = useSyncExternalStore(
    subscribeStorage,
    () => hasSeenAbout(locale),
    () => true,
  );
  const [dismissedAbout, setDismissedAbout] = useState(false);

  const homeHref = locale === 'en' ? '/' : `/${locale}`;
  const handleAboutClose = () => {
    setIsAboutOpen(false);
    setDismissedAbout(true);
    try {
      localStorage.setItem(`hasSeenAbout_${locale}`, 'true');
    } catch (error) {
      console.warn('Error saving to localStorage:', error);
    }
    window.dispatchEvent(new Event('poke-wordle-about'));
  };

  return (
    <>
      <header className="bg-white shadow-xs border-b border-gray-200 sticky top-0 z-40 safe-top">
        <nav
          className="container-responsive"
          role="navigation"
          aria-label={t('navbar.main_navigation')}
        >
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="shrink-0">
              <Link
                href={homeHref}
                title={t('title')}
                className="hover:opacity-80 transition-opacity"
              >
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {t('title')}
                </h1>
              </Link>
            </div>
            <ul
              className="flex items-center space-x-2 sm:space-x-4"
              role="list"
            >
              {showAbout && (
                <li>
                  <button
                    onClick={() => setIsAboutOpen(true)}
                    className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-red-300 transition-colors duration-200"
                    aria-label={t('navbar.about')}
                    title={t('navbar.about')}
                    type="button"
                  >
                    <InformationCircleIcon
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              )}
              {showSettings && (
                <li>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-red-300 transition-colors duration-200"
                    aria-label={t('navbar.settings')}
                    title={t('navbar.settings')}
                    type="button"
                  >
                    <Cog6ToothIcon
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => setIsLanguageOpen(true)}
                  className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-red-300 transition-colors duration-200"
                  aria-label={t('navbar.language')}
                  title={t('navbar.language')}
                  type="button"
                >
                  <LanguageIcon
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    aria-hidden="true"
                  />
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </header>
      {showAbout && (
        <DynamicAbout
          isOpen={isAboutOpen || (!seenAbout && !dismissedAbout)}
          onClose={handleAboutClose}
        />
      )}
      {showSettings && onSettingsChange && currentSettings && (
        <DynamicSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSettingsChange={onSettingsChange}
          currentSettings={currentSettings}
        />
      )}
      <LanguageSwitcher
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
        availableLocales={availableLocales}
        currentArticle={currentArticle}
      />
    </>
  );
}
