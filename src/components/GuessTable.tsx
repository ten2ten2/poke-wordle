'use client';

import { useTranslations } from 'next-intl';
import { GuessResult } from '@/types/pokemon';
import Image from 'next/image';
import clsx from 'clsx';

interface GuessTableProps {
  guesses: GuessResult[];
}

export default function GuessTable({ guesses }: GuessTableProps) {
  const t = useTranslations();

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
        <div className="flex items-center justify-center">
          <div className="flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20">
            <Image
              src={pranksterImageUrl}
              alt="Hidden by Prankster"
              width={96}
              height={96}
              className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
              sizes="(max-width: 640px) 64px, 80px"
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center h-8">
        <span className="text-gray-400 text-sm italic">???</span>
      </div>
    );
  };

  return (
    <div className="table-responsive">
      <style jsx>{`
        .gradient-divider {
          position: relative;
        }
        .gradient-divider::after {
          content: '';
          position: absolute;
          right: 0;
          top: 10%;
          bottom: 10%;
          width: 1px;
          background: linear-gradient(to bottom, transparent 0%, #e5e7eb 20%, #e5e7eb 80%, transparent 100%);
        }
        
        @media (max-width: 767px) {
          .mobile-table-scroll {
            scrollbar-width: thin;
            scrollbar-color: #d1d5db #f3f4f6;
          }
          .mobile-table-scroll::-webkit-scrollbar {
            height: 6px;
          }
          .mobile-table-scroll::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 3px;
          }
          .mobile-table-scroll::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 3px;
          }
        }
      `}</style>
      
      <div className="mobile-table-scroll">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-cell-responsive text-left text-xxs sm:text-xs font-medium text-gray-500 uppercase tracking-wider gradient-divider">
                {t('game.columns.profile')}
              </th>
              <th className="table-cell-responsive text-left text-xxs sm:text-xs font-medium text-gray-500 uppercase tracking-wider gradient-divider">
                {t('game.columns.name')}
              </th>
              <th className="table-cell-responsive text-left text-xxs sm:text-xs font-medium text-gray-500 uppercase tracking-wider gradient-divider">
                {t('game.columns.type')}
              </th>
              <th className="table-cell-responsive text-left text-xxs sm:text-xs font-medium text-gray-500 uppercase tracking-wider gradient-divider">
                {t('game.columns.baseStats')}
              </th>
              <th className="table-cell-responsive text-left text-xxs sm:text-xs font-medium text-gray-500 uppercase tracking-wider gradient-divider">
                <span className="mobile-hidden">{t('game.columns.generation')}</span>
                <span className="desktop-hidden">Gen</span>
              </th>
              <th className="table-cell-responsive text-left text-xxs sm:text-xs font-medium text-gray-500 uppercase tracking-wider gradient-divider">
                {t('game.columns.abilities')}
              </th>
              <th className="table-cell-responsive text-left text-xxs sm:text-xs font-medium text-gray-500 uppercase tracking-wider gradient-divider">
                {t('game.columns.evolution')}
              </th>
              <th className="table-cell-responsive text-left text-xxs sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('game.columns.tags')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {guesses.map((guess, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                {/* Profile */}
                <td className="table-cell-responsive whitespace-nowrap gradient-divider">
                  <div className="flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24">
                    <Image
                      src={guess.profile || '/images/pokemon-placeholder.png'}
                      alt={guess.name}
                      width={256}
                      height={256}
                      className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 object-contain"
                      sizes="(max-width: 640px) 64px, (max-width: 1024px) 80px, 96px"
                      priority={index < 3}
                    />
                  </div>
                </td>

                {/* Name */}
                <td className="table-cell-responsive whitespace-nowrap gradient-divider">
                  <div className="text-xs sm:text-sm font-medium text-gray-900 max-w-[80px] sm:max-w-none truncate">
                    {guess.name}
                  </div>
                </td>

                {/* Types */}
                <td className="table-cell-responsive gradient-divider">
                  {guess.fieldToHide === 'types' ? (
                    renderPranksterContent(guess.pranksterPokemonProfile || '')
                  ) : (
                    <div className="flex flex-wrap gap-1 max-w-[100px] sm:max-w-none">
                      {guess.types.map((type, typeIndex) => (
                        <span
                          key={typeIndex}
                          className={getTagClassName(type.status)}
                        >
                          {type.value}
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                {/* Base Stats */}
                <td className="table-cell-responsive whitespace-nowrap gradient-divider">
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
                </td>

                {/* Generation */}
                <td className="table-cell-responsive whitespace-nowrap gradient-divider">
                  {guess.fieldToHide === 'generation' ? (
                    renderPranksterContent(guess.pranksterPokemonProfile || '')
                  ) : (
                    <span
                      className={clsx(
                        getTagClassName(guess.generation.status),
                        getArrowClassName(guess.generation.arrow)
                      )}
                    >
                      <span className="mobile-hidden">{t(`generation.Gen${guess.generation.value}`)}</span>
                      <span className="desktop-hidden">{guess.generation.value}</span>
                    </span>
                  )}
                </td>

                {/* Abilities */}
                <td className="table-cell-responsive gradient-divider">
                  {guess.fieldToHide === 'abilities' ? (
                    renderPranksterContent(guess.pranksterPokemonProfile || '')
                  ) : (
                    <div className="flex flex-wrap gap-1 max-w-[120px] sm:max-w-none">
                      {guess.abilities.map((ability, abilityIndex) => (
                        <span
                          key={abilityIndex}
                          className={getTagClassName(ability.status)}
                        >
                          {ability.value}
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                {/* Evolution */}
                <td className="table-cell-responsive gradient-divider">
                  {guess.fieldToHide === 'evolution' ? (
                    renderPranksterContent(guess.pranksterPokemonProfile || '')
                  ) : (
                    <div className="flex flex-wrap gap-1 max-w-[100px] sm:max-w-none">
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
                    </div>
                  )}
                </td>

                {/* Tags */}
                <td className="table-cell-responsive">
                  {guess.fieldToHide === 'tags' ? (
                    renderPranksterContent(guess.pranksterPokemonProfile || '')
                  ) : (
                    <div className="flex flex-wrap gap-1 max-w-[120px] sm:max-w-none">
                      {guess.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={getTagClassName(tag.status)}
                        >
                          {t(`tags.${tag.value}`)}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile scroll hint */}
      <div className="mobile-only mt-2 text-center">
        <p className="text-xs text-gray-500">
          {t('game.scrollHint')}
        </p>
      </div>
    </div>
  );
} 