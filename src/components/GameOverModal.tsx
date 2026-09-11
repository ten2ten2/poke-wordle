'use client';

import { DialogTitle } from '@headlessui/react';
import Modal from './Modal';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Pokemon } from '@/types/pokemon';
import Image from 'next/image';
import { translateText, getWikiUrl } from '@/lib/pokemon';
import { useLocale } from 'next-intl';

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  isWon: boolean;
  targetPokemon: Pokemon | null;
  guessCount: number;
  maxGuesses: number;
}

export default function GameOverModal({
  isOpen,
  onClose,
  onRestart,
  isWon,
  targetPokemon,
  guessCount,
  maxGuesses,
}: GameOverModalProps) {
  const t = useTranslations();
  const locale = useLocale();

  if (!targetPokemon) return null;

  const typeColors: Record<string, string> = {
    normal: 'bg-gray-400',
    fire: 'bg-orange-500',
    water: 'bg-blue-500',
    electric: 'bg-yellow-400',
    grass: 'bg-green-500',
    ice: 'bg-cyan-300',
    fighting: 'bg-red-700',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-600',
    flying: 'bg-indigo-300',
    psychic: 'bg-pink-500',
    bug: 'bg-lime-500',
    rock: 'bg-yellow-800',
    ghost: 'bg-purple-700',
    dragon: 'bg-indigo-600',
    dark: 'bg-gray-800',
    steel: 'bg-gray-500',
    fairy: 'bg-pink-300',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="card-padding">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <DialogTitle
            as="h3"
            className="text-responsive-xl font-bold text-gray-900"
          >
            {isWon ? t('game.congratulations') : t('game.gameOver')}
          </DialogTitle>
          <button
            type="button"
            className="touch-target rounded-md text-gray-400 hover:text-gray-500 focus:outline-hidden focus:ring-2 focus:ring-red-300"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Pokemon Display */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40">
              <Image
                src={targetPokemon.profile}
                alt={translateText(targetPokemon.name, locale)}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 96px, (max-width: 1024px) 128px, 160px"
                loading="eager"
              />
            </div>
          </div>

          <h4 className="text-responsive-lg font-bold text-gray-900 mb-2">
            <a
              href={getWikiUrl(
                translateText(targetPokemon.name, locale),
                locale,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              title={translateText(targetPokemon.name, locale)}
            >
              {translateText(targetPokemon.name, locale)}{' '}
              <svg
                className="w-4 h-4 inline-block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                ></path>
              </svg>
            </a>
          </h4>

          {/* Types with colors */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {targetPokemon.types.map((type, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-white text-sm font-medium ${typeColors[type.toLowerCase()] ?? 'bg-gray-400'}`}
              >
                {translateText(type, locale)}
              </span>
            ))}
          </div>

          {/* Pokemon Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Generation */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {t('game.columns.generation')}
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {t(`generation.Gen${targetPokemon.generation}`)}
                </div>
              </div>

              {/* Base Stats Total */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {t('game.columns.baseStats')}
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {targetPokemon.base_stats_total}
                </div>
              </div>

              {/* Evolution Stage */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {t('game.columns.evolution')}
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {t(`evolution.stage${targetPokemon.evolution_stage}`)}
                </div>
              </div>

              {/* Evolution Method */}
              {targetPokemon.evolution_method_detail && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    {t('game.evolutionMethod')}
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    {t(
                      `evolutionMethods.${targetPokemon.evolution_method_detail}`,
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Abilities */}
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-500 mb-2">
                {t('game.columns.abilities')}
              </div>
              <div className="flex flex-wrap gap-2">
                {targetPokemon.abilities.map((ability, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    {translateText(ability, locale)}
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            {targetPokemon.tags && targetPokemon.tags.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-500 mb-2">
                  {t('game.columns.tags')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {targetPokemon.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                    >
                      {t(`tags.${tag}`)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Game Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-responsive-sm text-gray-500">
                {t('game.guessesUsed')}
              </div>
              <div className="text-responsive-lg font-bold text-gray-900">
                {guessCount} / {maxGuesses}
              </div>
            </div>
            <div>
              <div className="text-responsive-sm text-gray-500">
                {t('game.result')}
              </div>
              <div
                className={`text-responsive-lg font-bold ${
                  isWon ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isWon ? t('game.gameWon') : t('game.defeat')}
              </div>
            </div>
          </div>
        </div>

        {/* Result Message */}
        <div className="text-center mb-6">
          {isWon ? (
            <p className="text-responsive-base text-gray-700">
              {guessCount === 1
                ? t('game.guessedIn', { count: 1 })
                : t('game.guessedIn', { count: guessCount })}
            </p>
          ) : (
            <p className="text-responsive-base text-gray-700">
              {t('game.betterLuckNextTime')}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onRestart}
            className="btn-primary flex-1 bg-red-500 text-white border-red-500 shadow-xs hover:bg-red-600 hover:border-red-600"
          >
            {t('game.playAgain')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
