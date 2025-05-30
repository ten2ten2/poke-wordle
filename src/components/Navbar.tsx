'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Cog6ToothIcon, InformationCircleIcon, LanguageIcon } from '@heroicons/react/24/outline';
import Settings from './Settings';
import LanguageSwitcher from './LanguageSwitcher';
import { GameSettings } from '@/types/pokemon';
import About from './About';

interface NavbarProps {
  onSettingsChange: (settings: GameSettings) => void;
  currentSettings: GameSettings;
}

export default function Navbar({ onSettingsChange, currentSettings }: NavbarProps) {
  const t = useTranslations();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 safe-top">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo/Title */}
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {t('title')}
              </h1>
            </div>
            
            {/* Navigation Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* About Button */}
              <button
                onClick={() => setIsAboutOpen(true)}
                className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
                aria-label={t('navbar.about')}
                title={t('navbar.about')}
              >
                <InformationCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              
              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
                aria-label={t('navbar.settings')}
                title={t('navbar.settings')}
              >
                <Cog6ToothIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              
              {/* Language Button */}
              <button
                onClick={() => setIsLanguageOpen(true)}
                className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
                aria-label={t('navbar.language')}
                title={t('navbar.language')}
              >
                <LanguageIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* About Modal */}
      <About
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Settings Modal */}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsChange={onSettingsChange}
        currentSettings={currentSettings}
      />

      {/* Language Switcher Modal */}
      <LanguageSwitcher
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
      />

    </>
  );
} 