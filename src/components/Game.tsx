'use client';

import { version as datasetVersion } from '@/data/dataset.json';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useGameState } from '@/hooks/useGameState';
import { getRandomPranksterImage, translateText } from '@/lib/pokemon';
import { GameSettings, GuessResult } from '@/types/pokemon';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GameInput from '@/components/GameInput';
import GuessTable from '@/components/GuessTable';
import { DynamicGameOverModal } from '@/components/DynamicComponents';
import RandomKnowledge from '@/components/RandomKnowledge';
import { ColorLegend } from '@/components/StatusTag';
import { useHydrated } from '@/hooks/useHydrated';

export default function GameClient() {
  const hydrated = useHydrated();
  return <Game key={hydrated ? 'restored' : 'initial'} ready={hydrated} />;
}

function Game({ ready }: { ready: boolean }) {
  const locale = useLocale();
  const t = useTranslations();
  const {
    gameState,
    startNewGame,
    resetGame,
    updateSettings,
    addGuess,
    giveUp,
    isPokemonNameValid,
    availablePokemon,
  } = useGameState(locale, ready);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsChangeNotice, setShowSettingsChangeNotice] =
    useState(false);
  const [dismissedResult, setDismissedResult] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);

  const cancelGuess = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    setIsLoading(false);
    setError(null);
  }, []);

  const handleSettingsChange = useCallback(
    (settings: GameSettings) => {
      cancelGuess();
      const reset = updateSettings(settings);
      if (reset) {
        setDismissedResult(false);
        setShowSettingsChangeNotice(true);
      }
    },
    [cancelGuess, updateSettings],
  );

  const handleGuessSubmit = useCallback(
    async (name: string) => {
      // Prevent new guesses if game is over
      if (gameState.isGameOver || requestRef.current) {
        return false;
      }

      if (!isPokemonNameValid(name)) {
        setError(t('game.pokemonNotFound'));
        return false;
      }

      const target = gameState.targetPokemon ?? startNewGame();
      if (!target) return false;
      const controller = new AbortController();
      requestRef.current = controller;
      setShowSettingsChangeNotice(false);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/checkGuess', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            target_id: target.id,
            dataset_version: datasetVersion,
            is_prankster: gameState.settings.isPrankster,
            is_gen_arrow: gameState.settings.isGenArrow,
            locale,
            previousFieldToHide:
              gameState.settings.guessOrder === 'reverse'
                ? gameState.guesses[0]?.fieldToHide
                : gameState.guesses[gameState.guesses.length - 1]?.fieldToHide,
          }),
        });

        if (response.status === 409 && !controller.signal.aborted) {
          resetGame();
          window.location.reload();
          return false;
        }

        if (!response.ok) {
          throw new Error('Failed to check guess');
        }

        const result: GuessResult = await response.json();
        // if the field to hide is true and the guess is incorrect, then we need to get a random prankster image
        if (result.fieldToHide && !result.isCorrect) {
          result.pranksterPokemonProfile = getRandomPranksterImage();
        }
        if (!controller.signal.aborted) {
          addGuess(result);
          return true;
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error checking guess:', error);
          setError(t('game.requestFailed'));
        }
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
          setIsLoading(false);
        }
      }
      return false;
    },
    [
      gameState.targetPokemon,
      gameState.settings,
      gameState.isGameOver,
      gameState.guesses,
      isPokemonNameValid,
      addGuess,
      locale,
      t,
      startNewGame,
      resetGame,
    ],
  );

  const handleRandomStart = useCallback(() => {
    // Prevent random start if game is over
    if (gameState.isGameOver) {
      return;
    }

    setShowSettingsChangeNotice(false);

    if (availablePokemon.length > 0) {
      const randomPokemon =
        availablePokemon[Math.floor(Math.random() * availablePokemon.length)];
      handleGuessSubmit(randomPokemon.name);
    }
  }, [availablePokemon, gameState.isGameOver, handleGuessSubmit]);

  const handleGiveUp = useCallback(() => {
    giveUp();
  }, [giveUp]);

  const handleRestart = useCallback(() => {
    setShowSettingsChangeNotice(false);
    cancelGuess();
    setDismissedResult(false);
    resetGame();
  }, [resetGame, cancelGuess]);

  return (
    <div className="min-h-screen-safe bg-gray-50 flex flex-col safe-all">
      <Navbar
        onSettingsChange={handleSettingsChange}
        currentSettings={gameState.settings}
      />

      <RandomKnowledge />

      <main className="w-full flex-1 container-responsive section-padding">
        <div className="space-y-4 sm:space-y-6">
          {!gameState.targetPokemon && <p className="game-intro">{t('game.intro')}</p>}
          {showSettingsChangeNotice && (
            <aside
              className="card card-padding bg-orange-50 border border-orange-200 animate-slide-up"
              role="alert"
              aria-live="polite"
            >
              <div className="flex flex-col sm:flex-row sm:items-start">
                <div className="shrink-0 mb-2 sm:mb-0 sm:mr-3">
                  <svg
                    className="h-5 w-5 text-orange-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-responsive-sm font-medium text-orange-800">
                    {t('game.settingsChanged')}
                  </h3>
                  <div className="mt-2 text-responsive-sm text-orange-700">
                    <p>{t('game.settingsChangedDesc')}</p>
                  </div>
                </div>
              </div>
            </aside>
          )}
          <section
            className="card card-padding"
            aria-labelledby="game-input-heading"
          >
            <h2 id="game-input-heading" className="sr-only">
              {t('game.inputSection')}
            </h2>
            <GameInput
              key={`${gameState.settings.selectedGenerations.join(',')}-${gameState.settings.maxGuesses}-${gameState.settings.isPrankster}-${gameState.settings.isGenArrow}`}
              pokemon={availablePokemon}
              onSubmit={handleGuessSubmit}
              onRandomStart={handleRandomStart}
              onGiveUp={handleGiveUp}
              onRestart={handleRestart}
              disabled={!ready || isLoading}
              gameStarted={!!gameState.targetPokemon}
              gameOver={gameState.isGameOver}
              guessCount={gameState.guesses.length}
              maxGuesses={gameState.settings.maxGuesses}
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
          {gameState.targetPokemon && gameState.isGameOver && (
            <section
              className="text-center animate-bounce-subtle"
              aria-labelledby="game-status-heading"
              aria-live="assertive"
            >
              <h2 id="game-status-heading" className="sr-only">
                {t('game.statusSection')}
              </h2>
              {gameState.isWon ? (
                <p className="text-responsive-lg font-bold text-green-600">
                  {t('game.gameWon')}
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <p className="text-responsive-lg font-bold text-red-600">
                    {t('game.gameLost', {
                      pokemon: translateText(gameState.targetPokemon.name, locale),
                    })}
                  </p>
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 overflow-hidden rounded-lg">
                    <Image
                      src={gameState.targetPokemon.profile}
                      alt={`${translateText(gameState.targetPokemon.name, locale)} - ${t('game.correctAnswer')}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 48px, 64px"
                      loading="eager"
                    />
                  </div>
                </div>
              )}
            </section>
          )}
          <section aria-labelledby="game-results-heading">
            <h2 id="game-results-heading" className="sr-only">
              {t('game.resultsSection')}
            </h2>
            <ColorLegend />
            <GuessTable guesses={gameState.guesses} order={gameState.settings.guessOrder} />
          </section>
        </div>
      </main>

      <Footer />
      <DynamicGameOverModal
        isOpen={gameState.isGameOver && !dismissedResult}
        onClose={() => setDismissedResult(true)}
        onRestart={handleRestart}
        isWon={gameState.isWon}
        targetPokemon={gameState.targetPokemon}
        guessCount={gameState.guesses.length}
        maxGuesses={gameState.settings.maxGuesses}
      />
    </div>
  );
}
