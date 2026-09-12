import { datasetVersion } from '@/config/dataset';
import { GameSettings, Pokemon, GuessResult } from '@/types/pokemon';

const STORAGE_KEYS = {
  GAME_SETTINGS: 'poke-wordle-settings',
  GAME_PROGRESS: 'poke-wordle-progress',
} as const;

// 游戏进度数据结构
export interface GameProgress {
  datasetVersion: string;
  targetPokemon: Pokemon;
  guesses: GuessResult[];
  selectedGenerations: number[];
  isGameOver: boolean;
  isWon: boolean;
}

// 保存游戏设置
export function saveGameSettings(settings: GameSettings): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        STORAGE_KEYS.GAME_SETTINGS,
        JSON.stringify(settings),
      );
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
        const settings = JSON.parse(stored) as Partial<GameSettings> | null;
        if (
          settings &&
          Number.isInteger(settings.maxGuesses) &&
          settings.maxGuesses! > 0 &&
          Array.isArray(settings.selectedGenerations) &&
          settings.selectedGenerations.length > 0 &&
          settings.selectedGenerations.every(
            (gen) => Number.isInteger(gen) && gen >= 1 && gen <= 9,
          ) &&
          typeof settings.isPrankster === 'boolean' &&
          typeof settings.isGenArrow === 'boolean' &&
          (settings.guessOrder === 'normal' ||
            settings.guessOrder === 'reverse')
        ) {
          return settings as GameSettings;
        }
      }
    } catch (error) {
      console.warn('Failed to load game settings:', error);
    }
  }
  return null;
}

// 保存游戏进度
export function saveGameProgress(progress: GameProgress): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        STORAGE_KEYS.GAME_PROGRESS,
        JSON.stringify(progress),
      );
    } catch (error) {
      console.warn('Failed to save game progress:', error);
    }
  }
}

// 读取游戏进度
export function loadGameProgress(): GameProgress | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GAME_PROGRESS);
      if (stored) {
        const progress = JSON.parse(stored) as GameProgress | null;
        if (progress?.datasetVersion === datasetVersion) return progress;
        clearGameProgress();
      }
    } catch (error) {
      console.warn('Failed to load game progress:', error);
    }
  }
  return null;
}

// 清除游戏进度
export function clearGameProgress(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEYS.GAME_PROGRESS);
    } catch (error) {
      console.warn('Failed to clear game progress:', error);
    }
  }
}
