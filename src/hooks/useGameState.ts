import { useState, useCallback, useEffect, useRef } from 'react';
import { Pokemon, GameState, GameSettings, GuessResult } from '@/types/pokemon';
import { loadPokemonData, filterPokemonByGenerations, getRandomPokemon, translatePokemon } from '@/lib/pokemon';
import { saveGameSettings, loadGameSettings, saveGameProgress, loadGameProgress, clearGameProgress } from '@/lib/storage';

const defaultSettings: GameSettings = {
  maxGuesses: 10,
  selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  isPrankster: false,
  isGenArrow: false,
  guessOrder: 'reverse'
};

export function useGameState(locale: string) {
  // Initialize with stored settings or defaults
  const [gameState, setGameState] = useState<GameState>(() => {
    const storedSettings = loadGameSettings();
    return {
      targetPokemon: null,
      guesses: [],
      isGameOver: false,
      isWon: false,
      settings: storedSettings || defaultSettings
    };
  });

  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [pokemonNames, setPokemonNames] = useState<string[]>([]);
  
  // 简单标记，避免重复恢复
  const restoredRef = useRef(false);

  // Update Pokemon names when locale changes
  useEffect(() => {
    const translatedNames = availablePokemon.map(p => translatePokemon(p, locale).name);
    setPokemonNames(translatedNames);
  }, [locale, availablePokemon]);

  // Filter Pokemon when selectedGenerations change
  useEffect(() => {
    const filteredPokemon = filterPokemonByGenerations(loadPokemonData(), gameState.settings.selectedGenerations);
    setAvailablePokemon(filteredPokemon);

    // If there's an active game and the current target Pokemon is no longer available,
    // reset the game
    if (gameState.targetPokemon) {
      const isTargetStillAvailable = filteredPokemon.some(
        p => p.id === gameState.targetPokemon?.id
      );
      if (!isTargetStillAvailable) {
        setGameState(prev => ({
          ...prev,
          targetPokemon: null,
          guesses: [],
          isGameOver: false,
          isWon: false
        }));
      }
    }
  }, [gameState.settings.selectedGenerations, gameState.targetPokemon]);

  // 尝试恢复进度（仅在初始化时）
  useEffect(() => {
    if (availablePokemon.length > 0 && !restoredRef.current && !gameState.targetPokemon) {
      const savedProgress = loadGameProgress();
      if (savedProgress && 
          JSON.stringify(savedProgress.selectedGenerations.sort()) === JSON.stringify(gameState.settings.selectedGenerations.sort())) {
        
        const targetPokemon = availablePokemon.find(p => p.id === savedProgress.targetPokemon.id);
        if (targetPokemon) {
          setGameState(prev => ({
            ...prev,
            targetPokemon,
            guesses: savedProgress.guesses,
            isGameOver: savedProgress.isGameOver,
            isWon: savedProgress.isWon
          }));
        }
      }
      restoredRef.current = true;
    }
  }, [availablePokemon, gameState.settings.selectedGenerations, gameState.targetPokemon]);

  // Start new game
  const startNewGame = useCallback(() => {
    if (availablePokemon.length === 0) {
      return;
    }

    clearGameProgress();
    const targetPokemon = getRandomPokemon(availablePokemon);

    setGameState(prev => ({
      ...prev,
      targetPokemon,
      guesses: [],
      isGameOver: false,
      isWon: false
    }));
  }, [availablePokemon]);

  // Reset game to initial state
  const resetGame = useCallback(() => {
    clearGameProgress();
    setGameState(prev => ({
      ...prev,
      targetPokemon: null,
      guesses: [],
      isGameOver: false,
      isWon: false
    }));
    restoredRef.current = false;
  }, []);

  // Update settings and save to localStorage
  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setGameState(prev => {
      const updatedSettings = { ...prev.settings, ...newSettings };
      // Save to localStorage
      saveGameSettings(updatedSettings);
      
      // If only guessOrder changed, re-order existing guesses
      const prevGuessOrder = prev.settings.guessOrder;
      const newGuessOrder = updatedSettings.guessOrder;
      
      let reorderedGuesses = prev.guesses;
      if (prevGuessOrder !== newGuessOrder && prev.guesses.length > 0) {
        // When switching between normal and reverse order, simply reverse the current array
        reorderedGuesses = [...prev.guesses].reverse();
      }
      
      return {
        ...prev,
        settings: updatedSettings,
        guesses: reorderedGuesses
      };
    });
    
    if (newSettings.selectedGenerations) {
      restoredRef.current = false;
    }
  }, []);

  // Add guess
  const addGuess = useCallback((guess: GuessResult) => {
    setGameState(prev => {
      const newGuesses = gameState.settings.guessOrder === 'reverse'
        ? [guess, ...prev.guesses]
        : [...prev.guesses, guess];

      const isWon = guess.isCorrect;
      const isGameOver = isWon || newGuesses.length >= prev.settings.maxGuesses;

      // 保存进度（游戏结束时也保存，不清除）
      if (prev.targetPokemon) {
        saveGameProgress({
          targetPokemon: prev.targetPokemon,
          guesses: newGuesses,
          selectedGenerations: prev.settings.selectedGenerations,
          isGameOver,
          isWon
        });
      }

      return {
        ...prev,
        guesses: newGuesses,
        isWon,
        isGameOver
      };
    });
  }, [gameState.settings.guessOrder]);

  // Give up
  const giveUp = useCallback(() => {
    setGameState(prev => {
      const newState = {
        ...prev,
        isGameOver: true,
        isWon: false
      };

      // Save progress when giving up
      if (prev.targetPokemon) {
        saveGameProgress({
          targetPokemon: prev.targetPokemon,
          guesses: prev.guesses,
          selectedGenerations: prev.settings.selectedGenerations,
          isGameOver: true,
          isWon: false
        });
      }

      return newState;
    });
  }, []);

  // Check if Pokemon name exists (support both original and translated names)
  const isPokemonNameValid = useCallback((name: string) => {
    return availablePokemon.some(pokemon => {
      const translatedPokemon = translatePokemon(pokemon, locale);
      return translatedPokemon.name.toLowerCase() === name.toLowerCase() ||
        pokemon.name.toLowerCase() === name.toLowerCase();
    });
  }, [availablePokemon, locale]);

  return {
    gameState,
    availablePokemon,
    pokemonNames,
    startNewGame,
    resetGame,
    updateSettings,
    addGuess,
    giveUp,
    isPokemonNameValid
  };
} 