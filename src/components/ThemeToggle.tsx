'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

const subscribe = (listener: () => void) => {
  window.addEventListener('poke-wordle-theme-change', listener);
  return () => window.removeEventListener('poke-wordle-theme-change', listener);
};
const getSnapshot = () => document.documentElement.dataset.theme ?? 'light';
const getServerSnapshot = () => null;

export default function ThemeToggle() {
  const t = useTranslations('navbar');
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const label = t(theme === 'dark' ? 'lightMode' : 'darkMode');

  return (
    <button
      type="button"
      className="btn-icon"
      disabled={theme === null}
      aria-label={label}
      title={label}
      onClick={() => window.dispatchEvent(new Event('poke-wordle-theme-toggle'))}
    >
      <SunIcon className="theme-sun" aria-hidden="true" />
      <MoonIcon className="theme-moon" aria-hidden="true" />
    </button>
  );
}
