import { useState, useCallback, useEffect } from 'react';
import { Pokemon, GameState, GameSettings, GuessResult } from '@/types/pokemon';
import { loadPokemonData, filterPokemonByGenerations, getRandomPokemon } from '@/lib/pokemon';
import { saveGameSettings, loadGameSettings } from '@/lib/storage';

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

  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [pokemonNames, setPokemonNames] = useState<string[]>([]);

  // Load Pokemon data when locale changes
  useEffect(() => {
    const pokemonData = loadPokemonData(locale);
    setAllPokemon(pokemonData);
    
    // Reset game state when language changes to ensure consistency
    setGameState(prev => ({
      ...prev,
      targetPokemon: null,
      guesses: [],
      isGameOver: false,
      isWon: false
    }));
  }, [locale]);

  // Filter Pokemon and update names when allPokemon or selectedGenerations change
  useEffect(() => {
    if (allPokemon.length > 0) {
      const filteredPokemon = filterPokemonByGenerations(
        allPokemon,
        gameState.settings.selectedGenerations
      );
      setAvailablePokemon(filteredPokemon);
      setPokemonNames(filteredPokemon.map(p => p.name));
      
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
    }
  }, [allPokemon, gameState.settings.selectedGenerations, gameState.targetPokemon]);

  // Start new game
  const startNewGame = useCallback(() => {
    if (availablePokemon.length === 0) {
      return;
    }

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
    setGameState(prev => ({
      ...prev,
      targetPokemon: null,
      guesses: [],
      isGameOver: false,
      isWon: false
    }));
  }, []);

  // Update settings and save to localStorage
  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setGameState(prev => {
      const updatedSettings = { ...prev.settings, ...newSettings };
      // Save to localStorage
      saveGameSettings(updatedSettings);
      return {
        ...prev,
        settings: updatedSettings
      };
    });
  }, []);

  // Add guess
  const addGuess = useCallback((guess: GuessResult) => {
    setGameState(prev => {
      const newGuesses = gameState.settings.guessOrder === 'reverse' 
        ? [guess, ...prev.guesses]
        : [...prev.guesses, guess];

      const isWon = guess.isCorrect;
      const isGameOver = isWon || newGuesses.length >= prev.settings.maxGuesses;

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
    setGameState(prev => ({
      ...prev,
      isGameOver: true,
      isWon: false
    }));
  }, []);

  // Check if Pokemon name exists
  const isPokemonNameValid = useCallback((name: string) => {
    return pokemonNames.filter(pokeName => 
      pokeName.toLowerCase() === name.toLowerCase()
    ).length > 0;
  }, [pokemonNames]);

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