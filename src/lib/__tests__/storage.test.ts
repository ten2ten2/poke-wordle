/**
 * @jest-environment jsdom
 */

import {
  saveGameSettings,
  loadGameSettings,
  saveGameProgress,
  loadGameProgress,
  clearGameProgress,
} from '../storage';
import { GameSettings, Pokemon } from '@/types/pokemon';

const mockPokemon: Pokemon = {
  id: 1,
  pokedex_id_national: 1,
  name: 'Bulbasaur',
  profile: 'bulbasaur.png',
  generation: 1,
  types: ['Grass', 'Poison'],
  abilities: ['Overgrow', 'Chlorophyll'],
  base_stats_total: 318,
  base_stats: {
    attack: 49,
    defense: 49,
    hp: 45,
    sp_attack: 65,
    sp_defense: 65,
    speed: 45,
  },
  evolution_stage: 1,
  evolution_method: 'level',
  evolution_method_detail: '16',
  tags: ['Starter', 'Quadruped'],
};

const mockSettings: GameSettings = {
  maxGuesses: 10,
  selectedGenerations: [1, 2, 3],
  isPrankster: false,
  isGenArrow: true,
  guessOrder: 'reverse',
};

describe('storage.ts', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Set up proper localStorage mock
    mockLocalStorage = {};

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        }),
      },
      writable: true,
    });
  });

  describe('Game Settings', () => {
    test('should save and load game settings', () => {
      saveGameSettings(mockSettings);
      const loaded = loadGameSettings();

      expect(loaded).toEqual(mockSettings);
    });

    test('should return null when no settings saved', () => {
      const loaded = loadGameSettings();
      expect(loaded).toBeNull();
    });

    test.each([
      {},
      { selectedGenerations: null },
      { ...mockSettings, selectedGenerations: [] },
    ])('ignores incomplete settings: %j', (settings) => {
      mockLocalStorage['poke-wordle-settings'] = JSON.stringify(settings);
      expect(loadGameSettings()).toBeNull();
    });

    test('should handle corrupted settings data', () => {
      mockLocalStorage['poke-wordle-settings'] = 'invalid-json';
      const loaded = loadGameSettings();
      expect(loaded).toBeNull();
    });
  });

  describe('Game Progress', () => {
    const mockProgress = {
      targetPokemon: mockPokemon,
      guesses: [],
      selectedGenerations: [1, 2, 3],
      isGameOver: false,
      isWon: false,
    };

    test('should save and load game progress', () => {
      saveGameProgress(mockProgress);
      const loaded = loadGameProgress();

      expect(loaded).toEqual(mockProgress);
    });

    test('should return null when no progress saved', () => {
      const loaded = loadGameProgress();
      expect(loaded).toBeNull();
    });

    test('should handle corrupted progress data', () => {
      mockLocalStorage['poke-wordle-progress'] = 'invalid-json';
      const loaded = loadGameProgress();
      expect(loaded).toBeNull();
    });

    test('should clear game progress', () => {
      saveGameProgress(mockProgress);
      clearGameProgress();

      const loaded = loadGameProgress();
      expect(loaded).toBeNull();
    });
  });

  describe('Browser Compatibility', () => {
    test('should handle localStorage not available', () => {
      // Mock localStorage to throw error
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: jest.fn(() => {
            throw new Error('localStorage not available');
          }),
          getItem: jest.fn(() => {
            throw new Error('localStorage not available');
          }),
          removeItem: jest.fn(() => {
            throw new Error('localStorage not available');
          }),
        },
        writable: true,
      });

      expect(() => saveGameSettings(mockSettings)).not.toThrow();
      expect(loadGameSettings()).toBeNull();
    });
  });
});
