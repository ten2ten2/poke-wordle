'use client';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { getWikiUrl, translateText } from '@/lib/pokemon';
import type { Pokemon } from '@/types/pokemon';
import Modal, { ModalHeader } from './Modal';

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

  const name = translateText(targetPokemon.name, locale);
  const details = [
    { label: t('game.columns.generation'), value: t(`generation.Gen${targetPokemon.generation}`) },
    { label: t('game.baseStatsTotal'), value: targetPokemon.base_stats_total },
    { label: t('game.columns.evolution'), value: t(`evolution.stage${targetPokemon.evolution_stage}`) },
    ...(targetPokemon.evolution_method_detail ? [{
      label: t('game.evolutionMethod'),
      value: t(`evolutionMethods.${targetPokemon.evolution_method_detail}`),
    }] : []),
  ];
  const tagGroups = [
    { label: t('game.columns.abilities'), values: targetPokemon.abilities.map((ability) => translateText(ability, locale)), className: 'bg-info-bg text-info' },
    { label: t('game.columns.tags'), values: targetPokemon.tags?.map((tag) => t(`tags.${tag}`)) ?? [], className: 'bg-special-bg text-special' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="card-padding space-y-5 text-foreground">
        <ModalHeader title={isWon ? t('game.congratulations') : t('game.gameOver')} onClose={onClose} />

        <div className="space-y-3 text-center">
          <Image
            src={targetPokemon.profile}
            alt={name}
            width={160}
            height={160}
            className="mx-auto size-32 object-contain sm:size-40"
            sizes="(max-width: 640px) 128px, 160px"
            loading="eager"
          />
          <h3 className="text-xl font-semibold [overflow-wrap:anywhere] sm:text-2xl">
            <a
              href={getWikiUrl(name, locale)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              title={name}
            >
              {name}{' '}
              <ArrowTopRightOnSquareIcon aria-hidden="true" className="inline-block size-4" />
            </a>
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {targetPokemon.types.map((type) => (
              <span key={type} className="tag pokemon-type max-w-full" data-type={type.toLowerCase()}>
                <span className="tag-label">{translateText(type, locale)}</span>
              </span>
            ))}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-xl bg-subtle p-4 text-sm">
          {details.map(({ label, value }) => (
            <div key={label} className="min-w-0 [overflow-wrap:anywhere] hyphens-auto">
              <dt className="mb-1 text-muted">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
          {tagGroups.filter(({ values }) => values.length > 0).map(({ label, values, className }) => (
            <div key={label} className="col-span-2 min-w-0">
              <dt className="mb-2 text-muted">{label}</dt>
              <dd className="flex flex-wrap gap-2">
                {values.map((value) => (
                  <span key={value} className={`tag max-w-full text-left ${className}`}>
                    <span className="tag-label">{value}</span>
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        <dl className="grid grid-cols-2 gap-4 rounded-xl bg-subtle p-4 text-center [overflow-wrap:anywhere]">
          <div className="min-w-0">
            <dt className="text-sm text-muted">{t('game.guessesUsed')}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{guessCount} / {maxGuesses}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-sm text-muted">{t('game.result')}</dt>
            <dd className={`mt-1 text-lg font-semibold ${isWon ? 'text-success' : 'text-danger'}`}>
              {isWon ? t('game.victory') : t('game.defeat')}
            </dd>
          </div>
        </dl>

        <p className="text-center text-sm text-secondary">
          {isWon ? t('game.guessedIn', { count: guessCount }) : t('game.betterLuckNextTime')}
        </p>
        <button type="button" onClick={onRestart} title={t('game.playAgain')} className="btn-primary w-full">
          {t('game.playAgain')}
        </button>
      </div>
    </Modal>
  );
}
