'use client';

import { useLocale, useTranslations } from 'next-intl';
import { GuessResult } from '@/types/pokemon';
import { translateText } from '@/lib/pokemon';
import Image from 'next/image';
import clsx from 'clsx';

interface GuessTableProps {
  guesses: GuessResult[];
}

export default function GuessTable({ guesses }: GuessTableProps) {
  const t = useTranslations();
  const locale = useLocale();
  
  if (guesses.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <div className="text-gray-400 text-responsive-base">
          {t('game.noGuessesYet')}
        </div>
      </div>
    );
  }

  const getTagClassName = (status: string) => {
    return clsx('tag', {
      'tag-exact': status === 'exact',
      'tag-close': status === 'close',
      'tag-nope': status === 'nope',
    });
  };

  const getArrowClassName = (arrow?: 'upper' | 'lower') => {
    return clsx({
      'arrow-up': arrow === 'upper',
      'arrow-down': arrow === 'lower',
    });
  };

  const renderPranksterContent = (pranksterImageUrl: string) => {
    if (pranksterImageUrl) {
      return (
        <div className="flex items-center justify-center py-2">
          <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16">
            <Image
              src={pranksterImageUrl}
              alt="Hidden by Prankster"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              sizes="(max-width: 640px) 48px, 64px"
              unoptimized={true}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center py-2 h-12">
        <span className="text-gray-400 text-sm italic">???</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {guesses.map((guess, index) => (
        <div key={index} className="guess-table-card">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            {/* Pokemon Profile */}
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="relative w-16 h-16 mr-3 flex-shrink-0">
                <Image
                  src={guess.profile || '/images/pokemon-placeholder.png'}
                  alt={translateText(guess.name, locale)}
                  fill
                  className="object-contain"
                  sizes="64px"
                  priority={index < 3}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {translateText(guess.name, locale)}
              </h3>
            </div>

            {/* Vertical Property List */}
            <div className="text-center">
              {/* Types */}
              <div className="flex content-center items-center justify-start py-2 border-b border-dashed border-gray-100">
                <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">
                  {t('game.columns.type')}
                </span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {guess.fieldToHide === 'types' ? (
                    renderPranksterContent(guess.pranksterPokemonProfile || '')
                  ) : (
                    guess.types.map((type, typeIndex) => (
                      <span
                        key={typeIndex}
                        className={getTagClassName(type.status)}
                      >
                        {translateText(type.value, locale)}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Base Stats */}
              <div className="flex content-center items-center justify-start py-2 border-b border-dashed border-gray-100">
                <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">
                  {t('game.columns.baseStats')}
                </span>
                <div className="flex justify-end">
                  {guess.fieldToHide === 'base_stats' ? (
                    renderPranksterContent(guess.pranksterPokemonProfile || '')
                  ) : (
                    <span
                      className={clsx(
                        getTagClassName(guess.base_stats_total.status),
                        getArrowClassName(guess.base_stats_total.arrow)
                      )}
                    >
                      {guess.base_stats_total.value}
                    </span>
                  )}
                </div>
              </div>

              {/* Generation */}
              <div className="flex content-center items-center justify-start py-2 border-b border-dashed border-gray-100">
                <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">
                  {t('game.columns.generation')}
                </span>
                <div className="flex justify-end">
                  {guess.fieldToHide === 'generation' ? (
                    renderPranksterContent(guess.pranksterPokemonProfile || '')
                  ) : (
                    <span
                      className={clsx(
                        getTagClassName(guess.generation.status),
                        getArrowClassName(guess.generation.arrow)
                      )}
                    >
                      {t(`generation.Gen${guess.generation.value}`)}
                    </span>
                  )}
                </div>
              </div>

              {/* Abilities */}
              <div className="flex content-center items-center justify-start py-2 border-b border-dashed border-gray-100">
                <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">
                  {t('game.columns.abilities')}
                </span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {guess.fieldToHide === 'abilities' ? (
                    renderPranksterContent(guess.pranksterPokemonProfile || '')
                  ) : (
                    guess.abilities.map((ability, abilityIndex) => (
                      <span
                        key={abilityIndex}
                        className={getTagClassName(ability.status)}
                      >
                        {translateText(ability.value, locale)}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Evolution */}
              <div className="flex content-center items-center justify-start py-2 border-b border-dashed border-gray-100">
                <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">
                  {t('game.columns.evolution')}
                </span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {guess.fieldToHide === 'evolution' ? (
                    renderPranksterContent(guess.pranksterPokemonProfile || '')
                  ) : (
                    <>
                      {guess.evolution_stage.value !== null && (
                        <span className={getTagClassName(guess.evolution_stage.status)}>
                          {t(`evolution.stage${guess.evolution_stage.value}`)}
                        </span>
                      )}
                      {guess.evolution_method_detail.value && (
                        <span className={getTagClassName(guess.evolution_method_detail.status)}>
                          {t(`evolutionMethods.${guess.evolution_method_detail.value}`)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex content-center items-center justify-start py-2">
                <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">
                  {t('game.columns.tags')}
                </span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {guess.fieldToHide === 'tags' ? (
                    renderPranksterContent(guess.pranksterPokemonProfile || '')
                  ) : (
                    guess.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className={getTagClassName(tag.status)}
                      >
                        {t(`tags.${tag.value}`)}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex">
            {/* Pokemon Profile and Name */}
            <div className="pokemon-profile-section w-40 min-h-40">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                <Image
                  src={guess.profile || '/images/pokemon-placeholder.png'}
                  alt={translateText(guess.name, locale)}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 64px, 80px"
                  priority={index < 3}
                />
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 leading-tight break-words">
                {translateText(guess.name, locale)}
              </h3>
            </div>

            {/* Pokemon Properties */}
            <div className="flex-1 overflow-x-auto bg-white">
              <div className="flex min-w-full">
                {/* Types */}
                <div className="property-column flex-1 min-w-36 min-h-36">
                  <div className="guess-table-header">
                    <h4 className="text-xs font-medium text-gray-700">
                      {t('game.columns.type')}
                    </h4>
                  </div>
                  <div className="guess-table-cell">
                    {guess.fieldToHide === 'types' ? (
                      renderPranksterContent(guess.pranksterPokemonProfile || '')
                    ) : (
                      guess.types.map((type, typeIndex) => (
                        <span
                          key={typeIndex}
                          className={getTagClassName(type.status)}
                        >
                          {translateText(type.value, locale)}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Base Stats */}
                <div className="property-column flex-1 min-w-36 min-h-36">
                  <div className="guess-table-header">
                    <h4 className="text-xs font-medium text-gray-700">
                      {t('game.columns.baseStats')}
                    </h4>
                  </div>
                  <div className="guess-table-cell">
                    {guess.fieldToHide === 'base_stats' ? (
                      renderPranksterContent(guess.pranksterPokemonProfile || '')
                    ) : (
                      <span
                        className={clsx(
                          getTagClassName(guess.base_stats_total.status),
                          getArrowClassName(guess.base_stats_total.arrow)
                        )}
                      >
                        {guess.base_stats_total.value}
                      </span>
                    )}
                  </div>
                </div>

                {/* Generation */}
                <div className="property-column flex-1 min-w-36 min-h-36">
                  <div className="guess-table-header">
                    <h4 className="text-xs font-medium text-gray-700">
                      {t('game.columns.generation')}
                    </h4>
                  </div>
                  <div className="guess-table-cell">
                    {guess.fieldToHide === 'generation' ? (
                      renderPranksterContent(guess.pranksterPokemonProfile || '')
                    ) : (
                      <span
                        className={clsx(
                          getTagClassName(guess.generation.status),
                          getArrowClassName(guess.generation.arrow)
                        )}
                      >
                        {t(`generation.Gen${guess.generation.value}`)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Abilities */}
                <div className="property-column flex-1 min-w-36 min-h-36">
                  <div className="guess-table-header">
                    <h4 className="text-xs font-medium text-gray-700">
                      {t('game.columns.abilities')}
                    </h4>
                  </div>
                  <div className="guess-table-cell">
                    {guess.fieldToHide === 'abilities' ? (
                      renderPranksterContent(guess.pranksterPokemonProfile || '')
                    ) : (
                      guess.abilities.map((ability, abilityIndex) => (
                        <span
                          key={abilityIndex}
                          className={getTagClassName(ability.status)}
                        >
                          {translateText(ability.value, locale)}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Evolution */}
                <div className="property-column flex-1 min-w-36 min-h-36">
                  <div className="guess-table-header">
                    <h4 className="text-xs font-medium text-gray-700">
                      {t('game.columns.evolution')}
                    </h4>
                  </div>
                  <div className="guess-table-cell">
                    {guess.fieldToHide === 'evolution' ? (
                      renderPranksterContent(guess.pranksterPokemonProfile || '')
                    ) : (
                      <>
                        {guess.evolution_stage.value !== null && (
                          <span className={getTagClassName(guess.evolution_stage.status)}>
                            {t(`evolution.stage${guess.evolution_stage.value}`)}
                          </span>
                        )}
                        {guess.evolution_method_detail.value && (
                          <span className={getTagClassName(guess.evolution_method_detail.status)}>
                            {t(`evolutionMethods.${guess.evolution_method_detail.value}`)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="property-column flex-1 min-w-40 min-h-40">
                  <div className="guess-table-header">
                    <h4 className="text-xs font-medium text-gray-700">
                      {t('game.columns.tags')}
                    </h4>
                  </div>
                  <div className="guess-table-cell">
                    {guess.fieldToHide === 'tags' ? (
                      renderPranksterContent(guess.pranksterPokemonProfile || '')
                    ) : (
                      guess.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={getTagClassName(tag.status)}
                        >
                          {t(`tags.${tag.value}`)}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 