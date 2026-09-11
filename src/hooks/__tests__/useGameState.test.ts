/**
 * @jest-environment jsdom
 */

import { version as datasetVersion } from '@/data/dataset.json';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../useGameState';
import * as pokemonLib from '../../lib/pokemon';
import * as storage from '../../lib/storage';
import { Pokemon, GameSettings } from '@/types/pokemon';
import { GameProgress } from '../../lib/storage';

// Mock the entire modules
jest.mock('../../lib/pokemon');
jest.mock('../../lib/storage');

// Get typed mocked functions
const mockedPokemonLib = jest.mocked(pokemonLib);
const mockedStorage = jest.mocked(storage);

// Mock dependencies
const mockPokemon: Pokemon[] = [
  {
    id: 1,
    pokedex_id_national: 1,
    name: 'Bulbasaur',
    profile: 'bulbasaur.png',
    generation: 1,
    types: ['Grass', 'Poison'],
    abilities: ['Overgrow'],
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
    tags: ['Starter'],
  },
  {
    id: 2,
    pokedex_id_national: 2,
    name: 'Ivysaur',
    profile: 'ivysaur.png',
    generation: 1,
    types: ['Grass', 'Poison'],
    abilities: ['Overgrow'],
    base_stats_total: 405,
    base_stats: {
      attack: 62,
      defense: 63,
      hp: 60,
      sp_attack: 80,
      sp_defense: 80,
      speed: 60,
    },
    evolution_stage: 2,
    evolution_method: 'level',
    evolution_method_detail: '32',
    tags: ['Quadruped'],
  },
  {
    id: 25,
    pokedex_id_national: 25,
    name: 'Pikachu',
    profile: 'pikachu.png',
    generation: 2,
    types: ['Electric'],
    abilities: ['Static'],
    base_stats_total: 320,
    base_stats: {
      attack: 55,
      defense: 40,
      hp: 35,
      sp_attack: 50,
      sp_defense: 50,
      speed: 90,
    },
    evolution_stage: 1,
    evolution_method: 'item',
    evolution_method_detail: 'Thunder Stone',
    tags: ['Bipedal'],
  },
];

describe('useGameState', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    localStorage.clear();

    // Setup default mocks
    mockedPokemonLib.loadPokemonData.mockReturnValue(mockPokemon);
    mockedPokemonLib.filterPokemonByGenerations.mockReturnValue(mockPokemon);
    mockedPokemonLib.getRandomPokemon.mockReturnValue(mockPokemon[0]);
    mockedPokemonLib.translatePokemon.mockImplementation((pokemon) => pokemon);
    mockedStorage.loadGameSettings.mockReturnValue(null);
    mockedStorage.loadGameProgress.mockReturnValue(null);
    mockedStorage.saveGameSettings.mockImplementation(() => {});
    mockedStorage.saveGameProgress.mockImplementation(() => {});
    mockedStorage.clearGameProgress.mockImplementation(() => {});
  });

  describe('Initialization', () => {
    test('initializes with default state', () => {
      const { result } = renderHook(() => useGameState('en'));

      expect(result.current.gameState.targetPokemon).toBeNull();
      expect(result.current.gameState.guesses).toEqual([]);
      expect(result.current.gameState.isGameOver).toBe(false);
      expect(result.current.gameState.isWon).toBe(false);
      expect(result.current.gameState.settings.maxGuesses).toBe(10);
      expect(result.current.gameState.settings.selectedGenerations).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9,
      ]);
      expect(result.current.gameState.settings.isPrankster).toBe(false);
      expect(result.current.gameState.settings.isGenArrow).toBe(false);
      expect(result.current.gameState.settings.guessOrder).toBe('reverse');
    });

    test('initializes with stored settings', () => {
      const storedSettings: GameSettings = {
        maxGuesses: 8,
        selectedGenerations: [1, 2],
        isPrankster: true,
        isGenArrow: true,
        guessOrder: 'normal',
      };

      mockedStorage.loadGameSettings.mockReturnValue(storedSettings);

      const { result } = renderHook(() => useGameState('en'));

      expect(result.current.gameState.settings).toEqual(storedSettings);
    });

    test('restores game progress when available', () => {
      const mockProgress: GameProgress = {
        datasetVersion,
        targetPokemon: mockPokemon[0],
        guesses: [],
        selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        isGameOver: false,
        isWon: false,
      };

      mockedStorage.loadGameProgress.mockReturnValue(mockProgress);

      const { result } = renderHook(() => useGameState('en'));

      expect(result.current.gameState.targetPokemon).toEqual(mockPokemon[0]);
    });

    test('ignores stored progress without a target', () => {
      mockedStorage.loadGameProgress.mockReturnValue({
        selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        guesses: [],
        isGameOver: false,
        isWon: false,
      } as unknown as GameProgress);
      const { result } = renderHook(() => useGameState('en'));
      expect(result.current.gameState.targetPokemon).toBeNull();
    });

    test('does not restore progress if generations do not match', () => {
      const mockProgress: GameProgress = {
        datasetVersion,
        targetPokemon: mockPokemon[0],
        guesses: [],
        selectedGenerations: [1, 2], // Different from default [1,2,3,4,5,6,7,8,9]
        isGameOver: false,
        isWon: false,
      };

      mockedStorage.loadGameProgress.mockReturnValue(mockProgress);

      const { result } = renderHook(() => useGameState('en'));

      expect(result.current.gameState.targetPokemon).toBeNull();
    });
  });

  describe('Game Flow', () => {
    test('starts new game correctly', () => {
      const { result } = renderHook(() => useGameState('en'));

      act(() => {
        result.current.startNewGame();
      });

      expect(result.current.gameState.targetPokemon).toEqual(mockPokemon[0]);
      expect(result.current.gameState.guesses).toEqual([]);
      expect(result.current.gameState.isGameOver).toBe(false);
      expect(result.current.gameState.isWon).toBe(false);
      expect(mockedStorage.saveGameProgress).toHaveBeenCalledWith(
        expect.objectContaining({ targetPokemon: mockPokemon[0], guesses: [] }),
      );
    });

    test('does not start new game when no Pokemon available', () => {
      mockedPokemonLib.filterPokemonByGenerations.mockReturnValue([]);

      const { result } = renderHook(() => useGameState('en'));

      act(() => {
        result.current.startNewGame();
      });

      expect(result.current.gameState.targetPokemon).toBeNull();
    });

    test('resets game correctly', () => {
      const { result } = renderHook(() => useGameState('en'));

      // Start a game first
      act(() => {
        result.current.startNewGame();
      });

      expect(result.current.gameState.targetPokemon).not.toBeNull();

      // Reset the game
      act(() => {
        result.current.resetGame();
      });

      expect(result.current.gameState.targetPokemon).toBeNull();
      expect(result.current.gameState.guesses).toEqual([]);
      expect(result.current.gameState.isGameOver).toBe(false);
      expect(result.current.gameState.isWon).toBe(false);
      expect(mockedStorage.clearGameProgress).toHaveBeenCalled();
    });
  });

  describe('Settings Management', () => {
    test('updates settings correctly', () => {
      const { result } = renderHook(() => useGameState('en'));

      const newSettings: Partial<GameSettings> = {
        maxGuesses: 15,
        isPrankster: true,
      };

      act(() => {
        result.current.updateSettings(newSettings);
      });

      expect(result.current.gameState.settings.maxGuesses).toBe(15);
      expect(result.current.gameState.settings.isPrankster).toBe(true);
      expect(mockedStorage.saveGameSettings).toHaveBeenCalled();
    });

    test('updates selected generations and filters Pokemon', () => {
      const { result } = renderHook(() => useGameState('en'));

      const newGenerations = [1, 2];
      mockedPokemonLib.filterPokemonByGenerations.mockReturnValue([
        mockPokemon[0],
        mockPokemon[1],
      ]);

      act(() => {
        result.current.updateSettings({ selectedGenerations: newGenerations });
      });

      expect(result.current.gameState.settings.selectedGenerations).toEqual(
        newGenerations,
      );
      expect(mockedPokemonLib.filterPokemonByGenerations).toHaveBeenCalledWith(
        mockPokemon,
        newGenerations,
      );
    });

    test('resets game when target Pokemon is no longer available after generation change', () => {
      const { result } = renderHook(() => useGameState('en'));

      // Start a game with generation 1 Pokemon
      act(() => {
        result.current.startNewGame();
      });

      expect(result.current.gameState.targetPokemon).toEqual(mockPokemon[0]);

      // Change to only generation 2, which excludes the current target Pokemon
      mockedPokemonLib.filterPokemonByGenerations.mockReturnValue([
        mockPokemon[2],
      ]);

      act(() => {
        result.current.updateSettings({ selectedGenerations: [2] });
      });

      expect(result.current.gameState.targetPokemon).toBeNull();
      expect(result.current.gameState.guesses).toEqual([]);
      expect(result.current.gameState.isGameOver).toBe(false);
      expect(result.current.gameState.isWon).toBe(false);
    });

    test('handles guess order change and reorders existing guesses', () => {
      const { result } = renderHook(() => useGameState('en'));

      // Start a game and add some guesses
      act(() => {
        result.current.startNewGame();
      });

      const mockGuess1 = {
        name: 'Guess1',
        profile: 'guess1.png',
        generation: { value: 1, status: 'exact' as const },
        types: [{ value: 'Fire', status: 'nope' as const }],
        abilities: [{ value: 'Blaze', status: 'nope' as const }],
        base_stats_total: { value: 300, status: 'nope' as const },
        evolution_stage: { value: 1, status: 'exact' as const },
        evolution_method_detail: { value: 'level', status: 'exact' as const },
        tags: [{ value: 'Starter', status: 'exact' as const }],
        isCorrect: false,
        fieldToHide: null,
      };

      const mockGuess2 = {
        ...mockGuess1,
        name: 'Guess2',
      };

      act(() => {
        result.current.addGuess(mockGuess1);
        result.current.addGuess(mockGuess2);
      });

      // Initial order should be reverse (newest first)
      expect(result.current.gameState.guesses[0].name).toBe('Guess2');
      expect(result.current.gameState.guesses[1].name).toBe('Guess1');

      // Change guess order to normal
      act(() => {
        result.current.updateSettings({ guessOrder: 'normal' });
      });

      // Order should be reversed (oldest first)
      expect(result.current.gameState.guesses[0].name).toBe('Guess1');
      expect(result.current.gameState.guesses[1].name).toBe('Guess2');
      expect(mockedStorage.saveGameProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({
          guesses: [mockGuess1, mockGuess2],
        }),
      );
      const persisted = mockedStorage.saveGameProgress.mock.calls.at(-1)![0];
      const savedSettings =
        mockedStorage.saveGameSettings.mock.calls.at(-1)![0];
      mockedStorage.loadGameProgress.mockReturnValue(persisted);
      mockedStorage.loadGameSettings.mockReturnValue(savedSettings);
      const restored = renderHook(() => useGameState('en'));
      expect(
        restored.result.current.gameState.guesses.map((guess) => guess.name),
      ).toEqual(['Guess1', 'Guess2']);
    });
  });

  describe('Guess Management', () => {
    test('adds guess correctly in reverse order', () => {
      const { result } = renderHook(() => useGameState('en'));

      // Start a game first
      act(() => {
        result.current.startNewGame();
      });

      const mockGuess = {
        name: 'Ivysaur',
        profile: 'ivysaur.png',
        generation: { value: 1, status: 'exact' as const },
        types: [{ value: 'Grass', status: 'exact' as const }],
        abilities: [{ value: 'Overgrow', status: 'exact' as const }],
        base_stats_total: {
          value: 405,
          status: 'nope' as const,
          arrow: 'lower' as const,
        },
        evolution_stage: { value: 2, status: 'nope' as const },
        evolution_method_detail: { value: '32', status: 'close' as const },
        tags: [{ value: 'Quadruped', status: 'nope' as const }],
        isCorrect: false,
        fieldToHide: null,
      };

      act(() => {
        result.current.addGuess(mockGuess);
      });

      expect(result.current.gameState.guesses).toHaveLength(1);
      expect(result.current.gameState.guesses[0]).toEqual(mockGuess);
      expect(mockedStorage.saveGameProgress).toHaveBeenCalled();
    });

    test('adds guess correctly in normal order', () => {
      const { result } = renderHook(() => useGameState('en'));

      // Change to normal order first
      act(() => {
        result.current.updateSettings({ guessOrder: 'normal' });
      });

      // Start a game
      act(() => {
        result.current.startNewGame();
      });

      const mockGuess = {
        name: 'Ivysaur',
        profile: 'ivysaur.png',
        generation: { value: 1, status: 'exact' as const },
        types: [{ value: 'Grass', status: 'exact' as const }],
        abilities: [{ value: 'Overgrow', status: 'exact' as const }],
        base_stats_total: {
          value: 405,
          status: 'nope' as const,
          arrow: 'lower' as const,
        },
        evolution_stage: { value: 2, status: 'nope' as const },
        evolution_method_detail: { value: '32', status: 'close' as const },
        tags: [{ value: 'Quadruped', status: 'nope' as const }],
        isCorrect: false,
        fieldToHide: null,
      };

      act(() => {
        result.current.addGuess(mockGuess);
      });

      expect(result.current.gameState.guesses).toHaveLength(1);
      expect(result.current.gameState.guesses[0]).toEqual(mockGuess);
    });

    test('handles winning guess', () => {
      const { result } = renderHook(() => useGameState('en'));

      // Start a game first
      act(() => {
        result.current.startNewGame();
      });

      const winningGuess = {
        name: 'Bulbasaur',
        profile: 'bulbasaur.png',
        generation: { value: 1, status: 'exact' as const },
        types: [{ value: 'Grass', status: 'exact' as const }],
        abilities: [{ value: 'Overgrow', status: 'exact' as const }],
        base_stats_total: { value: 318, status: 'exact' as const },
        evolution_stage: { value: 1, status: 'exact' as const },
        evolution_method_detail: { value: '16', status: 'exact' as const },
        tags: [{ value: 'Starter', status: 'exact' as const }],
        isCorrect: true,
        fieldToHide: null,
      };

      act(() => {
        result.current.addGuess(winningGuess);
      });

      expect(result.current.gameState.isWon).toBe(true);
      expect(result.current.gameState.isGameOver).toBe(true);
      expect(mockedStorage.saveGameProgress).toHaveBeenCalled();
    });

    test('handles game over when max guesses reached', () => {
      const { result } = renderHook(() => useGameState('en'));

      // Set max guesses to 1
      act(() => {
        result.current.updateSettings({ maxGuesses: 1 });
      });

      // Start a game
      act(() => {
        result.current.startNewGame();
      });

      const wrongGuess = {
        name: 'Ivysaur',
        profile: 'ivysaur.png',
        generation: { value: 1, status: 'exact' as const },
        types: [{ value: 'Grass', status: 'exact' as const }],
        abilities: [{ value: 'Overgrow', status: 'exact' as const }],
        base_stats_total: {
          value: 405,
          status: 'nope' as const,
          arrow: 'lower' as const,
        },
        evolution_stage: { value: 2, status: 'nope' as const },
        evolution_method_detail: { value: '32', status: 'close' as const },
        tags: [{ value: 'Quadruped', status: 'nope' as const }],
        isCorrect: false,
        fieldToHide: null,
      };

      act(() => {
        result.current.addGuess(wrongGuess);
      });

      expect(result.current.gameState.isGameOver).toBe(true);
      expect(result.current.gameState.isWon).toBe(false);
      expect(result.current.gameState.guesses).toHaveLength(1);
    });

    test('handles giving up', () => {
      const { result } = renderHook(() => useGameState('en'));

      // Start a game first
      act(() => {
        result.current.startNewGame();
      });

      act(() => {
        result.current.giveUp();
      });

      expect(result.current.gameState.isGameOver).toBe(true);
      expect(result.current.gameState.isWon).toBe(false);
      expect(mockedStorage.saveGameProgress).toHaveBeenCalled();
    });
  });

  describe('Pokemon Name Validation', () => {
    test('validates Pokemon names correctly', () => {
      const { result } = renderHook(() => useGameState('en'));

      expect(result.current.isPokemonNameValid('Bulbasaur')).toBe(true);
      expect(result.current.isPokemonNameValid('bulbasaur')).toBe(true); // case insensitive
      expect(result.current.isPokemonNameValid('InvalidPokemon')).toBe(false);
    });

    test('validates translated Pokemon names', () => {
      const { result } = renderHook(() => useGameState('zh-hans'));

      // Mock translation
      mockedPokemonLib.translatePokemon.mockReturnValue({
        ...mockPokemon[0],
        name: '妙蛙种子',
      });

      expect(result.current.isPokemonNameValid('妙蛙种子')).toBe(true);
      expect(result.current.isPokemonNameValid('Bulbasaur')).toBe(true); // original name should still work
    });
  });

  describe('Locale Changes', () => {
    test('updates Pokemon names when locale changes', () => {
      const { result, rerender } = renderHook(
        ({ locale }) => useGameState(locale),
        { initialProps: { locale: 'en' } },
      );

      expect(result.current.pokemonNames).toEqual([
        'Bulbasaur',
        'Ivysaur',
        'Pikachu',
      ]);

      // Mock translation for Chinese
      mockedPokemonLib.translatePokemon.mockImplementation(
        (pokemon, locale) => {
          if (locale === 'zh-hans') {
            return { ...pokemon, name: `${pokemon.name}_CN` };
          }
          return pokemon;
        },
      );

      rerender({ locale: 'zh-hans' });

      expect(result.current.pokemonNames).toEqual([
        'Bulbasaur_CN',
        'Ivysaur_CN',
        'Pikachu_CN',
      ]);
    });
  });
});
