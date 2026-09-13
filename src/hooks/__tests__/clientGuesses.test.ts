import { act, renderHook } from '@testing-library/react';
import { datasetVersion } from '@/config/dataset';
import { loadPokemonData, translateText } from '@/lib/pokemon';
import * as storage from '@/lib/storage';
import type { GameSettings } from '@/types/pokemon';
import { useGameState } from '../useGameState';

jest.mock('@/lib/storage');

const saved = jest.mocked(storage);
const target = loadPokemonData().find((row) => row.name === 'charmander')!;
const settings: GameSettings = {
  maxGuesses: 10,
  selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  isPrankster: false,
  isGenArrow: false,
  guessOrder: 'reverse',
};

beforeEach(() => {
  jest.clearAllMocks();
  saved.loadGameSettings.mockReturnValue(settings);
  saved.loadGameProgress.mockReturnValue({
    datasetVersion, targetPokemon: target, guesses: [],
    selectedGenerations: settings.selectedGenerations, isGameOver: false, isWon: false,
  });
});

afterEach(() => jest.restoreAllMocks());

test('compares real Pokemon data locally and persists the result', () => {
  const { result } = renderHook(() => useGameState('en'));
  act(() => { expect(result.current.submitGuess('  Ｐｉｋａｃｈｕ  ')).toBe(true); });
  expect(result.current.gameState.guesses).toEqual([
    expect.objectContaining({
      name: 'pikachu', isCorrect: false, fieldToHide: null,
      generation: { value: 1, status: 'exact', arrow: undefined },
      types: [{ value: 'electric', status: 'nope' }],
      base_stats_total: { value: 320, status: 'close', arrow: 'lower' },
    }),
  ]);
  expect(saved.saveGameProgress).toHaveBeenLastCalledWith(expect.objectContaining({
    datasetVersion, targetPokemon: target, guesses: result.current.gameState.guesses,
  }));
});

test.each(['en', 'ja', 'fr', 'de', 'it', 'es', 'ko', 'zh-hans', 'zh-hant'])(
  'accepts the localized name in %s and stops after winning', (locale) => {
    const { result } = renderHook(() => useGameState(locale));
    act(() => {
      expect(result.current.submitGuess(translateText(target.name, locale))).toBe(true);
      expect(result.current.submitGuess('Pikachu')).toBe(false);
    });
    expect(result.current.gameState).toMatchObject({ isWon: true, isGameOver: true });
    expect(result.current.gameState.guesses).toHaveLength(1);
  },
);

test('rejects invalid names and Pokemon outside the selected generations without starting a game', () => {
  saved.loadGameSettings.mockReturnValue({ ...settings, selectedGenerations: [2] });
  saved.loadGameProgress.mockReturnValue(null);
  const { result } = renderHook(() => useGameState('en'));
  act(() => {
    for (const name of ['', 'unknown-pokemon', 'Pikachu']) {
      expect(result.current.submitGuess(name)).toBe(false);
    }
  });
  expect(result.current.gameState.targetPokemon).toBeNull();
  expect(result.current.gameState.guesses).toEqual([]);
  expect(saved.saveGameProgress).not.toHaveBeenCalled();
});

test('the first valid guess selects a target and compares it in the same submission', () => {
  saved.loadGameProgress.mockReturnValue(null);
  jest.spyOn(Math, 'random').mockReturnValue(0);
  const { result } = renderHook(() => useGameState('en'));
  act(() => { expect(result.current.submitGuess('Bulbasaur')).toBe(true); });
  expect(result.current.gameState.targetPokemon?.name).toBe('bulbasaur');
  expect(result.current.gameState).toMatchObject({ isGameOver: true, isWon: true });
  expect(result.current.gameState.guesses).toHaveLength(1);
});

test('consecutive synchronous guesses use the latest state and respect the guess limit', () => {
  saved.loadGameSettings.mockReturnValue({ ...settings, maxGuesses: 2 });
  const { result } = renderHook(() => useGameState('en'));
  act(() => {
    expect(result.current.submitGuess('Pikachu')).toBe(true);
    expect(result.current.submitGuess('Bulbasaur')).toBe(true);
    expect(result.current.submitGuess('Charmander')).toBe(false);
  });
  expect(result.current.gameState.guesses.map((guess) => guess.name)).toEqual(['bulbasaur', 'pikachu']);
  expect(result.current.gameState).toMatchObject({ isGameOver: true, isWon: false });
});

test.each(['normal', 'reverse'] as const)(
  'prankster mode avoids repeating the latest hidden field in %s order', (guessOrder) => {
    saved.loadGameSettings.mockReturnValue({ ...settings, guessOrder, isPrankster: true, isGenArrow: true });
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { result } = renderHook(() => useGameState('en'));
    act(() => {
      result.current.submitGuess('Pikachu');
      result.current.submitGuess('Bulbasaur');
      result.current.submitGuess('Chikorita');
    });
    const chronological = guessOrder === 'normal' ? result.current.gameState.guesses : result.current.gameState.guesses.toReversed();
    expect(chronological.map((guess) => guess.fieldToHide)).toEqual(['generation', 'types', 'generation']);
    expect(chronological.every((guess) => !!guess.pranksterPokemonProfile)).toBe(true);
    expect(chronological[2].generation).toEqual({ value: 2, status: 'close', arrow: 'lower' });
    act(() => { result.current.submitGuess('Charmander'); });
    const winning = result.current.gameState.guesses.find((guess) => guess.isCorrect)!;
    expect(winning.fieldToHide).toBeNull();
    expect(winning.pranksterPokemonProfile).toBeUndefined();
  },
);

test('restart and give up apply to subsequent local submissions', () => {
  const { result } = renderHook(() => useGameState('en'));
  act(() => { result.current.giveUp(); });
  act(() => { expect(result.current.submitGuess('Charmander')).toBe(false); });
  act(() => { result.current.resetGame(); });
  act(() => { expect(result.current.submitGuess('Pikachu')).toBe(true); });
  expect(result.current.gameState.guesses).toHaveLength(1);
});
