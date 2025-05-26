import { GameSettings } from '@/types/pokemon';

const STORAGE_KEYS = {
  GAME_SETTINGS: 'poke-wordle-settings',
  PREFERRED_LOCALE: 'poke-wordle-locale'
} as const;

// 保存游戏设置
export function saveGameSettings(settings: GameSettings): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save game settings:', error);
    }
  }
}

// 读取游戏设置
export function loadGameSettings(): GameSettings | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS);
      if (stored) {
        return JSON.parse(stored) as GameSettings;
      }
    } catch (error) {
      console.warn('Failed to load game settings:', error);
    }
  }
  return null;
}

// 保存首选语言
export function savePreferredLocale(locale: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERRED_LOCALE, locale);
    } catch (error) {
      console.warn('Failed to save preferred locale:', error);
    }
  }
}

// 读取首选语言
export function loadPreferredLocale(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(STORAGE_KEYS.PREFERRED_LOCALE);
    } catch (error) {
      console.warn('Failed to load preferred locale:', error);
    }
  }
  return null;
}

// 清除所有存储的设置
export function clearAllSettings(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEYS.GAME_SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.PREFERRED_LOCALE);
    } catch (error) {
      console.warn('Failed to clear settings:', error);
    }
  }
} 