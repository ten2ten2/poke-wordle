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
    normal: 'bg-gray-100 text-gray-900',
    fire: 'bg-orange-100 text-orange-900',
    water: 'bg-blue-100 text-blue-900',
    electric: 'bg-yellow-100 text-yellow-900',
    grass: 'bg-green-100 text-green-900',
    ice: 'bg-cyan-100 text-cyan-900',
    fighting: 'bg-red-100 text-red-900',
    poison: 'bg-purple-100 text-purple-900',
    ground: 'bg-amber-100 text-amber-900',
    flying: 'bg-indigo-100 text-indigo-900',
    psychic: 'bg-pink-100 text-pink-900',
    bug: 'bg-lime-100 text-lime-900',
    rock: 'bg-yellow-100 text-yellow-900',
    ghost: 'bg-purple-100 text-purple-900',
    dragon: 'bg-indigo-100 text-indigo-900',
    dark: 'bg-gray-100 text-gray-900',
    steel: 'bg-slate-100 text-slate-900',
    fairy: 'bg-pink-100 text-pink-900',
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
            className="btn-icon"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <XMarkIcon aria-hidden="true" />
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
                className={`px-3 py-1 rounded-full text-sm font-medium ${typeColors[type.toLowerCase()] ?? 'bg-gray-100 text-gray-900'}`}
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
            className="btn-primary flex-1"
          >
            {t('game.playAgain')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
