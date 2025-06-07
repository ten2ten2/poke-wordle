'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Cog6ToothIcon, InformationCircleIcon, LanguageIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import Settings from './Settings';
import LanguageSwitcher from './LanguageSwitcher';
import { GameSettings } from '@/types/pokemon';
import About from './About';
import Link from 'next/link';
import { isKnowledgeSupported } from '@/config/knowledge';

interface NavbarProps {
  onSettingsChange?: (settings: GameSettings) => void;
  currentSettings?: GameSettings;
  showAbout?: boolean; // 是否显示 About 按钮
  showSettings?: boolean; // 是否显示设置按钮
  availableLocales?: string[]; // 可用的语言列表
}

export default function Navbar({
  onSettingsChange,
  currentSettings,
  showAbout = true,
  showSettings = true,
  availableLocales
}: NavbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isClientSide, setIsClientSide] = useState(false);

  // Check if current locale supports Knowledge page
  const showKnowledge = isKnowledgeSupported(locale);

  // Generate the correct href for home page
  const homeHref = locale === 'en' ? '/' : `/${locale}`;
  
  // Generate the correct href for knowledge page
  const knowledgeHref = locale === 'en' ? '/knowledge' : `/${locale}/knowledge`;

  // Ensure we're on the client side to prevent hydration mismatch
  useEffect(() => {
    setIsClientSide(true);
  }, []);

  // Check if this is a first-time user and show about modal - only after client-side hydration
  useEffect(() => {
    if (!isClientSide) return;

    try {
      const hasSeenAbout = localStorage.getItem(`hasSeenAbout_${locale}`);
      if (!hasSeenAbout) {
        setIsAboutOpen(true);
      }
    } catch (error) {
      // If localStorage is not available, default to showing about modal
      console.warn('localStorage not available:', error);
      setIsAboutOpen(true);
    }
  }, [locale, isClientSide]);

  // Handle closing about modal and mark as seen
  const handleAboutClose = () => {
    setIsAboutOpen(false);

    // Only try to set localStorage on client side
    if (isClientSide) {
      try {
        localStorage.setItem(`hasSeenAbout_${locale}`, 'true');
      } catch (error) {
        console.warn('Error saving to localStorage:', error);
      }
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 safe-top">
        <nav className="container-responsive" role="navigation" aria-label={t('navbar.main_navigation')}>
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo/Title */}
            <div className="flex-shrink-0">
              <Link href={homeHref} title={t('title')} className="hover:opacity-80 transition-opacity">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {t('title')}
                </h1>
              </Link>
            </div>

            {/* Navigation Actions */}
            <ul className="flex items-center space-x-2 sm:space-x-4" role="list">
              {/* Knowledge Button - only show if locale supports it */}
              {showKnowledge && (
                <li>
                  <Link
                    href={knowledgeHref}
                    className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-300 transition-colors duration-200"
                    aria-label={t('navbar.knowledge')}
                    title={t('navbar.knowledge')}
                  >
                    <BookOpenIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </Link>
                </li>
              )}

              {/* About Button */}
              {showAbout && (
                <li>
                  <button
                    onClick={() => setIsAboutOpen(true)}
                    className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-300 transition-colors duration-200"
                    aria-label={t('navbar.about')}
                    title={t('navbar.about')}
                    type="button"
                  >
                    <InformationCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </button>
                </li>
              )}

              {/* Settings Button */}
              {showSettings && (
                <li>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-300 transition-colors duration-200"
                    aria-label={t('navbar.settings')}
                    title={t('navbar.settings')}
                    type="button"
                  >
                    <Cog6ToothIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </button>
                </li>
              )}

              {/* Language Button */}
              <li>
                <button
                  onClick={() => setIsLanguageOpen(true)}
                  className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-300 transition-colors duration-200"
                  aria-label={t('navbar.language')}
                  title={t('navbar.language')}
                  type="button"
                >
                  <LanguageIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* About Modal */}
      {showAbout && (
        <About
          isOpen={isAboutOpen}
          onClose={handleAboutClose}
        />
      )}

      {/* Settings Modal */}
      {showSettings && onSettingsChange && currentSettings && (
        <Settings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSettingsChange={onSettingsChange}
          currentSettings={currentSettings}
        />
      )}

      {/* Language Switcher Modal */}
      <LanguageSwitcher
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
        availableLocales={availableLocales}
      />

    </>
  );
} 