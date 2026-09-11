import { version as datasetVersion } from '@/data/dataset.json';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { GameState, GameSettings, GuessResult } from '@/types/pokemon';
import {
  loadPokemonData,
  filterPokemonByGenerations,
  getRandomPokemon,
  translateText,
} from '@/lib/pokemon';
import {
  saveGameSettings,
  loadGameSettings,
  saveGameProgress,
  loadGameProgress,
  clearGameProgress,
} from '@/lib/storage';

const defaultSettings: GameSettings = {
  maxGuesses: 10,
  selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  isPrankster: false,
  isGenArrow: false,
  guessOrder: 'reverse',
};

function emptyGame(settings: GameSettings): GameState {
  return {
    settings,
    targetPokemon: null,
    guesses: [],
    isGameOver: false,
    isWon: false,
  };
}

function initialState(): GameState {
  const settings = loadGameSettings() ?? defaultSettings;
  const progress = loadGameProgress();
  const state = emptyGame(settings);
  if (
    !progress?.targetPokemon?.id ||
    progress.datasetVersion !== datasetVersion ||
    !Array.isArray(progress.guesses) ||
    !Array.isArray(progress.selectedGenerations) ||
    progress.selectedGenerations.length !==
      settings.selectedGenerations.length ||
    !progress.selectedGenerations.every((gen) =>
      settings.selectedGenerations.includes(gen),
    )
  )
    return state;
  const targetPokemon = filterPokemonByGenerations(
    loadPokemonData(),
    settings.selectedGenerations,
  ).find((pokemon) => pokemon.id === progress.targetPokemon.id && pokemon.name === progress.targetPokemon.name);
  return targetPokemon ? { ...state, ...progress, targetPokemon } : state;
}

export function useGameState(locale: string, restoreProgress = true) {
  const [gameState, setGameState] = useState(() =>
    restoreProgress ? initialState() : emptyGame(defaultSettings),
  );
  const current = useRef(gameState);
  const availablePokemon = useMemo(
    () =>
      filterPokemonByGenerations(
        loadPokemonData(),
        gameState.settings.selectedGenerations,
      ),
    [gameState.settings.selectedGenerations],
  );
  const pokemonNames = useMemo(
    () => availablePokemon.map((p) => translateText(p.name, locale)),
    [availablePokemon, locale],
  );

  const commit = useCallback((next: GameState) => {
    current.current = next;
    setGameState(next);
    if (next.targetPokemon) {
      saveGameProgress({
        datasetVersion,
        targetPokemon: next.targetPokemon,
        guesses: next.guesses,
        selectedGenerations: next.settings.selectedGenerations,
        isGameOver: next.isGameOver,
        isWon: next.isWon,
      });
    } else {
      clearGameProgress();
    }
  }, []);

  const startNewGame = useCallback(() => {
    if (!availablePokemon.length) return;
    const targetPokemon = getRandomPokemon(availablePokemon);
    commit({ ...emptyGame(current.current.settings), targetPokemon });
    return targetPokemon;
  }, [availablePokemon, commit]);

  const resetGame = useCallback(
    () => commit(emptyGame(current.current.settings)),
    [commit],
  );

  const updateSettings = useCallback(
    (changes: Partial<GameSettings>) => {
      const previous = current.current;
      const settings = { ...previous.settings, ...changes };
      saveGameSettings(settings);
      const invalidatesGame =
        settings.maxGuesses !== previous.settings.maxGuesses ||
        settings.isPrankster !== previous.settings.isPrankster ||
        settings.isGenArrow !== previous.settings.isGenArrow ||
        settings.selectedGenerations.length !==
          previous.settings.selectedGenerations.length ||
        !settings.selectedGenerations.every((gen) =>
          previous.settings.selectedGenerations.includes(gen),
        );
      commit(
        invalidatesGame
          ? emptyGame(settings)
          : {
              ...previous,
              settings,
              guesses:
                settings.guessOrder === previous.settings.guessOrder
                  ? previous.guesses
                  : previous.guesses.toReversed(),
            },
      );
      return invalidatesGame;
    },
    [commit],
  );

  const addGuess = useCallback(
    (guess: GuessResult) => {
      const previous = current.current;
      if (!previous.targetPokemon || previous.isGameOver) return;
      const guesses =
        previous.settings.guessOrder === 'reverse'
          ? [guess, ...previous.guesses]
          : [...previous.guesses, guess];
      commit({
        ...previous,
        guesses,
        isWon: guess.isCorrect,
        isGameOver:
          guess.isCorrect || guesses.length >= previous.settings.maxGuesses,
      });
    },
    [commit],
  );

  const giveUp = useCallback(() => {
    if (current.current.targetPokemon && !current.current.isGameOver) {
      commit({ ...current.current, isGameOver: true, isWon: false });
    }
  }, [commit]);

  const validNames = useMemo(
    () => new Set(
      [...availablePokemon.map((p) => p.name), ...pokemonNames].map((name) => name.toLowerCase()),
    ),
    [availablePokemon, pokemonNames],
  );
  const isPokemonNameValid = useCallback(
    (name: string) => validNames.has(name.toLowerCase()),
    [validNames],
  );

  return {
    gameState,
    availablePokemon,
    pokemonNames,
    startNewGame,
    resetGame,
    updateSettings,
    addGuess,
    giveUp,
    isPokemonNameValid,
  };
}
