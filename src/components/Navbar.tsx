'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations, useLocale } from 'next-intl';
import {
  Cog6ToothIcon,
  InformationCircleIcon,
  LanguageIcon,
} from '@heroicons/react/24/outline';
import type { GameSettings } from '@/types/pokemon';
import Link from 'next/link';
import type { KnowledgeArticle } from '@/config/knowledge';
import Pokeball from './Pokeball';
import ThemeToggle from './ThemeToggle';
import { localePath } from '@/i18n/routing';

const Settings = dynamic(() => import('./Settings'), { ssr: false });
const About = dynamic(() => import('./About'), { ssr: false });
const LanguageSwitcher = dynamic(() => import('./LanguageSwitcher'), { ssr: false });

interface NavbarProps {
  onSettingsChange?: (settings: GameSettings) => void;
  currentSettings?: GameSettings;
  showAbout?: boolean;
  showSettings?: boolean;
  currentArticle?: KnowledgeArticle;
}

export default function Navbar({
  onSettingsChange,
  currentSettings,
  showAbout = true,
  showSettings = true,
  currentArticle,
}: NavbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  // null defers loading until the first open; false preserves closing transitions.
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean | null>(null);
  const [isLanguageOpen, setIsLanguageOpen] = useState<boolean | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean | null>(null);

  return (
    <>
      <header className="bg-surface shadow-xs border-b border-line sticky top-0 z-40 safe-top">
        <nav
          className="container-responsive"
          aria-label={t('navbar.main_navigation')}
        >
          <div className="flex justify-between items-center gap-1 sm:gap-2 h-16 pl-1 pr-2 sm:pl-2 sm:pr-6">
            <div className="min-w-0">
              <Link
                href={localePath(locale)}
                title={t('title')}
                className="flex min-w-0 items-center gap-1.5 sm:gap-3 hover:opacity-80 transition-opacity"
              >
                <Pokeball className="size-7 sm:size-8 shrink-0" />
                <span className="text-base sm:text-xl font-semibold text-foreground truncate">
                  {t('title')}
                </span>
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
              <li><ThemeToggle /></li>
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
      {showAbout && isAboutOpen !== null && (
        <About
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
        />
      )}
      {showSettings && isSettingsOpen !== null && onSettingsChange && currentSettings && (
        <Settings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSettingsChange={onSettingsChange}
          currentSettings={currentSettings}
        />
      )}
      {isLanguageOpen !== null && <LanguageSwitcher
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
        currentArticle={currentArticle}
      />}
    </>
  );
}
