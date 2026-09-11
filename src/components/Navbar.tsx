'use client';

import { useState } from 'react';
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
import Pokeball from './Pokeball';

interface NavbarProps {
  onSettingsChange?: (settings: GameSettings) => void;
  currentSettings?: GameSettings;
  showAbout?: boolean; // 是否显示 About 按钮
  showSettings?: boolean; // 是否显示设置按钮
  availableLocales?: string[]; // 可用的语言列表
  currentArticle?: KnowledgeArticle; // 当前知识文章（如果在文章页面）
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
  const homeHref = locale === 'en' ? '/' : `/${locale}`;

  return (
    <>
      <header className="bg-white shadow-xs border-b border-gray-200 sticky top-0 z-40 safe-top">
        <nav
          className="container-responsive"
          role="navigation"
          aria-label={t('navbar.main_navigation')}
        >
          <div className="flex justify-between items-center gap-2 h-16">
            <div className="min-w-0">
              <Link
                href={homeHref}
                title={t('title')}
                className="flex min-w-0 items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
              >
                <Pokeball className="size-7 sm:size-8 shrink-0" />
                <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                  {t('title')}
                </h1>
              </Link>
            </div>
            <ul
              className="flex shrink-0 items-center gap-0.5 sm:gap-2"
              role="list"
            >
              {showAbout && (
                <li>
                  <button
                    onClick={() => setIsAboutOpen(true)}
                    className="btn-icon"
                    aria-label={t('navbar.about')}
                    title={t('navbar.about')}
                    type="button"
                  >
                    <InformationCircleIcon
                      aria-hidden="true"
                    />
                  </button>
                </li>
              )}
              {showSettings && (
                <li>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="btn-icon"
                    aria-label={t('navbar.settings')}
                    title={t('navbar.settings')}
                    type="button"
                  >
                    <Cog6ToothIcon
                      aria-hidden="true"
                    />
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => setIsLanguageOpen(true)}
                  className="btn-icon"
                  aria-label={t('navbar.language')}
                  title={t('navbar.language')}
                  type="button"
                >
                  <LanguageIcon
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
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
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
