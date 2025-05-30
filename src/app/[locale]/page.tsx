'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useGameState } from '@/hooks/useGameState';
import { getRandomPranksterImage } from '@/lib/pokemon';
import { GameSettings, GuessResult } from '@/types/pokemon';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GameInput from '@/components/GameInput';
import GuessTable from '@/components/GuessTable';
import GameOverModal from '@/components/GameOverModal';

export default function GamePage() {
  const locale = useLocale();
  const t = useTranslations();
  const {
    gameState,
    pokemonNames,
    startNewGame,
    resetGame,
    updateSettings,
    addGuess,
    giveUp,
    isPokemonNameValid,
    availablePokemon
  } = useGameState(locale);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLanguageChangeNotice, setShowLanguageChangeNotice] = useState(false);
  const [showSettingsChangeNotice, setShowSettingsChangeNotice] = useState(false);
  const [pendingGuess, setPendingGuess] = useState<string | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  // Show notice when language changes and there was an active game
  useEffect(() => {
    if (!gameState.targetPokemon && gameState.guesses.length === 0) {
      setShowLanguageChangeNotice(false);
    }
  }, [gameState.targetPokemon, gameState.guesses.length]);

  // Show game over modal when game ends
  useEffect(() => {
    if (gameState.isGameOver && gameState.targetPokemon) {
      setShowGameOverModal(true);
    }
  }, [gameState.isGameOver, gameState.targetPokemon]);

  // Handle pending guess when game starts
  useEffect(() => {
    if (gameState.targetPokemon && pendingGuess) {
      const processPendingGuess = async () => {
        const name = pendingGuess;
        setPendingGuess(null);
        
        if (!isPokemonNameValid(name)) {
          setError(t('game.pokemonNotFound'));
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const response = await fetch('/api/checkGuess', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name,
              target_id: gameState.targetPokemon!.id,
              is_prankster: gameState.settings.isPrankster,
              is_gen_arrow: gameState.settings.isGenArrow,
              locale,
              previousFieldToHide: null,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to check guess');
          }

          const result: GuessResult = await response.json();
          // if the field to hide is true and the guess is incorrect, then we need to get a random prankster image
          if (result.fieldToHide && !result.isCorrect) {
            result.pranksterPokemonProfile = getRandomPranksterImage();
          }
          addGuess(result);
        } catch (error) {
          console.error('Error checking guess:', error);
          setError('An error occurred while checking your guess');
        } finally {
          setIsLoading(false);
        }
      };

      processPendingGuess();
    }
  }, [gameState.targetPokemon, pendingGuess, gameState.settings, isPokemonNameValid, addGuess, locale, t]);

  const handleSettingsChange = useCallback((newSettings: GameSettings) => {
    const currentSettings = gameState.settings;
    
    // Check if any settings that affect game validity have changed
    const gameAffectingSettingsChanged = 
      newSettings.maxGuesses !== currentSettings.maxGuesses ||
      newSettings.selectedGenerations.length !== currentSettings.selectedGenerations.length ||
      !newSettings.selectedGenerations.every(gen => currentSettings.selectedGenerations.includes(gen)) ||
      newSettings.isPrankster !== currentSettings.isPrankster ||
      newSettings.isGenArrow !== currentSettings.isGenArrow;
    
    updateSettings(newSettings);
    
    // Only reset the game if settings that affect game validity have changed
    // guessOrder only affects display order, so we don't need to reset for that
    if (gameAffectingSettingsChanged) {
      resetGame();
      setShowSettingsChangeNotice(true);
    }
  }, [updateSettings, resetGame, gameState.settings]);

  const handleGuessSubmit = useCallback(async (name: string) => {
    // Prevent new guesses if game is over
    if (gameState.isGameOver) {
      return;
    }
    
    if (!isPokemonNameValid(name)) {
      setError(t('game.pokemonNotFound'));
      return;
    }

    // If no game is started, start one first and set pending guess
    if (!gameState.targetPokemon) {
      setPendingGuess(name);
      setShowLanguageChangeNotice(false);
      setShowSettingsChangeNotice(false);
      startNewGame();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkGuess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          target_id: gameState.targetPokemon.id,
          is_prankster: gameState.settings.isPrankster,
          is_gen_arrow: gameState.settings.isGenArrow,
          locale,
          previousFieldToHide: gameState.settings.guessOrder === 'reverse' ? gameState.guesses[0]?.fieldToHide : gameState.guesses[gameState.guesses.length - 1]?.fieldToHide,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check guess');
      }

      const result: GuessResult = await response.json();
      // if the field to hide is true and the guess is incorrect, then we need to get a random prankster image
      if (result.fieldToHide && !result.isCorrect) {
        result.pranksterPokemonProfile = getRandomPranksterImage();
      }
      addGuess(result);
    } catch (error) {
      console.error('Error checking guess:', error);
      setError('An error occurred while checking your guess');
    } finally {
      setIsLoading(false);
    }
  }, [gameState.targetPokemon, gameState.settings, gameState.isGameOver, gameState.guesses, isPokemonNameValid, addGuess, locale, t, startNewGame]);

  const handleRandomStart = useCallback(() => {
    // Prevent random start if game is over
    if (gameState.isGameOver) {
      return;
    }
    
    setShowLanguageChangeNotice(false);
    setShowSettingsChangeNotice(false);
    
    if (availablePokemon.length > 0) {
      const randomPokemon = availablePokemon[Math.floor(Math.random() * availablePokemon.length)];
      handleGuessSubmit(randomPokemon.name);
    }
  }, [availablePokemon, gameState.isGameOver, handleGuessSubmit]);

  const handleGiveUp = useCallback(() => {
    giveUp();
  }, [giveUp]);

  const handleRestart = useCallback(() => {
    setShowLanguageChangeNotice(false);
    setShowSettingsChangeNotice(false);
    setPendingGuess(null); // Clear any pending guess
    setShowGameOverModal(false); // Close game over modal
    resetGame();
  }, [resetGame]);

  return (
    <div className="min-h-screen-safe bg-gray-50 flex flex-col safe-all">
      <Navbar
        onSettingsChange={handleSettingsChange}
        currentSettings={gameState.settings}
      />

      <main className="flex-1 container-responsive section-padding">
        <div className="space-y-4 sm:space-y-6">
          {/* Language Change Notice */}
          {showLanguageChangeNotice && (
            <aside 
              className="card card-padding bg-blue-50 border border-blue-200 animate-slide-up" 
              role="alert" 
              aria-live="polite"
            >
              <div className="flex flex-col sm:flex-row sm:items-start">
                <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-3">
                  <svg 
                    className="h-5 w-5 text-blue-400" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-responsive-sm font-medium text-blue-800">
                    {t('game.languageChanged')}
                  </h3>
                  <div className="mt-2 text-responsive-sm text-blue-700">
                    <p>
                      {t('game.languageChangedDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Settings Change Notice */}
          {showSettingsChangeNotice && (
            <aside 
              className="card card-padding bg-orange-50 border border-orange-200 animate-slide-up" 
              role="alert" 
              aria-live="polite"
            >
              <div className="flex flex-col sm:flex-row sm:items-start">
                <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-3">
                  <svg 
                    className="h-5 w-5 text-orange-400" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-responsive-sm font-medium text-orange-800">
                    {t('game.settingsChanged')}
                  </h3>
                  <div className="mt-2 text-responsive-sm text-orange-700">
                    <p>
                      {t('game.settingsChangedDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Game Input Section */}
          <section className="card card-padding" aria-labelledby="game-input-heading">
            <h2 id="game-input-heading" className="sr-only">
              {t('game.inputSection')}
            </h2>
            <GameInput
              pokemonNames={pokemonNames}
              onSubmit={handleGuessSubmit}
              onRandomStart={handleRandomStart}
              onGiveUp={handleGiveUp}
              onRestart={handleRestart}
              disabled={isLoading}
              gameStarted={!!gameState.targetPokemon}
              gameOver={gameState.isGameOver}
            />
            
            {error && (
              <div 
                className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-responsive-sm text-red-600 animate-slide-up" 
                role="alert" 
                aria-live="assertive"
              >
                {error}
              </div>
            )}
          </section>

          {/* Game Status Section */}
          <section className="text-center" aria-labelledby="game-status-heading">
            <h2 id="game-status-heading" className="sr-only">
              {t('game.statusSection')}
            </h2>
            {gameState.targetPokemon ? (
              <div className="space-y-3">
                <p className="text-responsive-lg font-medium text-gray-700" aria-live="polite">
                  {t('game.guessCount', {
                    current: gameState.guesses.length,
                    max: gameState.settings.maxGuesses
                  })}
                </p>
                
                {gameState.isGameOver && (
                  <div className="mt-4 animate-bounce-subtle" aria-live="assertive">
                    {gameState.isWon ? (
                      <p className="text-responsive-lg font-bold text-green-600">
                        {t('game.gameWon')}
                      </p>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                        <p className="text-responsive-lg font-bold text-red-600">
                          {t('game.gameLost', {
                            pokemon: gameState.targetPokemon?.name || ''
                          })}
                        </p>
                        <div className="relative w-12 h-12 sm:w-16 sm:h-16 overflow-hidden rounded-lg">
                          <Image
                            src={gameState.targetPokemon?.profile || ''}
                            alt={`${gameState.targetPokemon?.name || ''} - ${t('game.correctAnswer')}`}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 48px, 64px"
                            priority
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-responsive-lg font-medium text-gray-500">
                {t('game.startPrompt')}
              </p>
            )}
          </section>

          {/* Game Results Section */}
          <section className="card overflow-hidden" aria-labelledby="game-results-heading">
            <h2 id="game-results-heading" className="sr-only">
              {t('game.resultsSection')}
            </h2>
            <GuessTable guesses={gameState.guesses} />
          </section>
        </div>
      </main>

      <Footer />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        onRestart={handleRestart}
        isWon={gameState.isWon}
        targetPokemon={gameState.targetPokemon}
        guessCount={gameState.guesses.length}
        maxGuesses={gameState.settings.maxGuesses}
      />
    </div>
  );
} 