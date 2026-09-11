'use client';

import { memo, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import type { GuessResult } from '@/types/pokemon';
import { translateText } from '@/lib/pokemon';
import StatusTag from './StatusTag';
import Pokeball from './Pokeball';

const columns = ['type', 'baseStats', 'generation', 'abilities', 'evolution', 'tags'] as const;

const GuessTable = memo(function GuessTable({ guesses, order = 'reverse' }: {
  guesses: GuessResult[];
  order?: 'normal' | 'reverse';
}) {
  const t = useTranslations();
  const locale = useLocale();
  if (!guesses.length) return <p className="py-6 text-center text-sm text-gray-500">{t('game.noGuessesYet')}</p>;

  function hidden(guess: GuessResult) {
    return guess.pranksterPokemonProfile ? (
      <Image src={guess.pranksterPokemonProfile} alt={t('game.hiddenField')} width={40} height={40} className="size-10 object-contain" unoptimized />
    ) : <span title={t('game.hiddenField')}>???<span className="sr-only">{t('game.hiddenField')}</span></span>;
  }

  return (
    <div className="guess-results">
      <div className="guess-headings" aria-hidden="true">
        <span>{t('game.columns.pokemon')}</span>
        {columns.map((column) => <span key={column}>{t(`game.columns.${column}`)}</span>)}
      </div>
      {guesses.map((guess, index) => {
        const number = order === 'reverse' ? guesses.length - index : index + 1;
        const latest = number === guesses.length;
        const name = translateText(guess.name, locale);
        const fields: ReactNode[] = [
          guess.fieldToHide === 'types' ? hidden(guess) : guess.types.map((type) => <StatusTag key={type.value} status={type.status}>{translateText(type.value, locale)}</StatusTag>),
          guess.fieldToHide === 'base_stats' ? hidden(guess) : <StatusTag status={guess.base_stats_total.status} arrow={guess.base_stats_total.arrow}>{guess.base_stats_total.value}</StatusTag>,
          guess.fieldToHide === 'generation' ? hidden(guess) : <StatusTag status={guess.generation.status} arrow={guess.generation.arrow}>{t(`generation.Gen${guess.generation.value}`)}</StatusTag>,
          guess.fieldToHide === 'abilities' ? hidden(guess) : guess.abilities.map((ability) => <StatusTag key={ability.value} status={ability.status}>{translateText(ability.value, locale)}</StatusTag>),
          guess.fieldToHide === 'evolution' ? hidden(guess) : <>
            {guess.evolution_stage.value !== null && <StatusTag status={guess.evolution_stage.status}>{t(`evolution.stage${guess.evolution_stage.value}`)}</StatusTag>}
            {guess.evolution_method_detail.value && <StatusTag status={guess.evolution_method_detail.status}>{t(`evolutionMethods.${guess.evolution_method_detail.value}`)}</StatusTag>}
          </>,
          guess.fieldToHide === 'tags' ? hidden(guess) : guess.tags.map((tag) => <StatusTag key={tag.value} status={tag.status}>{t(`tags.${tag.value}`)}</StatusTag>),
        ];
        return (
          <article key={`${guess.name}-${index}`} className="guess-table-card" data-latest={latest || undefined} aria-label={`${t('game.guessNumber', { number })}: ${name}`}>
            <header className="guess-identity">
              {guess.profile ? <Image src={guess.profile} alt={name} width={48} height={48} className="size-12 shrink-0 object-contain" loading={latest ? 'eager' : 'lazy'} /> : <Pokeball className="size-12 shrink-0" />}
              <div className="min-w-0">
                <p className="guess-number">{t('game.guessNumber', { number })}{latest && <span className="latest-label">{t('game.latestGuess')}</span>}</p>
                <h3 className="font-semibold text-gray-900">{name}</h3>
              </div>
            </header>
            <dl className="guess-fields">
              {columns.map((column, field) => (
                <div key={column} className="guess-field">
                  <dt className="text-[13px] text-gray-600 lg:sr-only">{t(`game.columns.${column}`)}</dt>
                  <dd>{fields[field]}{Array.isArray(fields[field]) && !(fields[field] as ReactNode[]).length && <span className="text-gray-400">—</span>}</dd>
                </div>
              ))}
            </dl>
          </article>
        );
      })}
    </div>
  );
});

export default GuessTable;
