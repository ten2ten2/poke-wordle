'use client';

import { useMemo, useRef, useState } from 'react';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import type { Pokemon } from '@/types/pokemon';
import { pokemonSearchNames, translateText } from '@/lib/pokemon';

const normalize = (value: string) => value.trim().normalize('NFKC').toLowerCase();

interface GameInputProps {
  pokemon: Pokemon[];
  onSubmit: (name: string) => Promise<boolean>;
  onRandomStart: () => void;
  onGiveUp: () => void;
  onRestart: () => void;
  disabled: boolean;
  gameStarted: boolean;
  gameOver: boolean;
  guessCount: number;
  maxGuesses: number;
}

export default function GameInput({ pokemon, onSubmit, onRandomStart, onGiveUp, onRestart, disabled, gameStarted, gameOver, guessCount, maxGuesses }: GameInputProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirm, setConfirm] = useState<'giveUp' | 'restart' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const submission = useRef(0);
  const choices = useMemo(() => pokemon.map((row) => ({
    ...row, label: translateText(row.name, locale), aliases: pokemonSearchNames(row.name).map(normalize),
  })), [pokemon, locale]);
  const query = normalize(input);
  const dexPrefix = /^#?\d+$/.test(query) ? String(Number(query.replace('#', ''))) : null;
  const matches = useMemo(() => {
    if (!query) return [];
    return choices.filter((row) => dexPrefix !== null
      ? String(row.pokedex_id_national).startsWith(dexPrefix)
      : row.aliases.some((name) => name.includes(query)))
      .sort((a, b) => dexPrefix !== null
        ? Number(String(b.pokedex_id_national) === dexPrefix) - Number(String(a.pokedex_id_national) === dexPrefix) || a.pokedex_id_national - b.pokedex_id_national
        : Number(b.aliases.includes(query)) - Number(a.aliases.includes(query)));
  }, [choices, query, dexPrefix]);
  const suggestions = matches.slice(0, 12);
  const blocked = disabled || pending;

  async function submit() {
    if (blocked || gameOver || !query || composing.current) return;
    const request = ++submission.current;
    const exact = choices.filter((row) => dexPrefix !== null ? String(row.pokedex_id_national) === dexPrefix : row.aliases.includes(query));
    const name = exact.length === 1 ? exact[0].name : matches.length === 1 && dexPrefix !== null ? matches[0].name : input.trim();
    setPending(true); setFailed(false);
    try {
      const accepted = await onSubmit(name);
      if (accepted && request === submission.current) setInput('');
    } catch {
      if (request === submission.current) setFailed(true);
    } finally {
      if (request === submission.current) setPending(false);
    }
  }

  function resetInput() {
    submission.current++;
    setPending(false); setFailed(false); setInput(''); setConfirm(null);
  }

  function requestAction(action: 'giveUp' | 'restart') {
    if (gameStarted && !gameOver) setConfirm(action);
    else { resetInput(); onRestart(); }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <Combobox value={input} onChange={(name: string | null) => setInput(name ?? '')} disabled={blocked || gameOver}>
          <div className="guess-input-row">
            <div className="min-w-0">
              <ComboboxInput
                ref={inputRef}
                value={input}
                aria-label={t('game.searchHint')}
                onChange={(event) => setInput(event.target.value)}
                onCompositionStart={() => { composing.current = true; }}
                onCompositionEnd={() => { composing.current = false; }}
                onKeyDownCapture={(event) => {
                  if (event.key === 'Enter' && (event.nativeEvent.isComposing || composing.current)) {
                    event.preventDefault(); event.stopPropagation();
                  }
                }}
                placeholder={t('game.inputPlaceholder')}
                title={t('game.searchHint')}
                className="input-primary"
                autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              />
              {query && (
                <ComboboxOptions anchor={{ to: 'bottom start', gap: 6 }} className="pokemon-suggestions" modal={false}>
                  {suggestions.map((row) => (
                    <ComboboxOption key={row.id} value={row.label} className="pokemon-option">
                      <Image src={row.profile} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />
                      <span className="min-w-0 flex-1">{row.label}</span>
                      <span className="text-[13px] tabular-nums text-muted">#{String(row.pokedex_id_national).padStart(4, '0')}</span>
                    </ComboboxOption>
                  ))}
                  <p className="px-3 py-2 text-[13px] text-secondary" role="status">
                    {matches.length ? t('game.suggestionCount', { shown: suggestions.length, total: matches.length }) : t('game.noMatches')}
                  </p>
                </ComboboxOptions>
              )}
            </div>
            <button type="submit" disabled={blocked || gameOver || !query} className="btn-primary" aria-busy={pending}>
              {blocked ? <span className="inline-flex items-center gap-2"><span className="loading-spinner size-4" aria-hidden="true" />{t('game.submitting')}</span> : t('game.submit')}
            </button>
          </div>
        </Combobox>
      </form>
      {failed && <p role="alert" className="text-sm text-accent-text">{t('game.requestFailed')}</p>}
      <div className="guess-actions">
        {gameStarted && (
          <p className="text-sm font-medium tabular-nums text-secondary" aria-live="polite" aria-atomic="true">
            {t('game.guessCount', { current: guessCount, max: maxGuesses })}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-end gap-1">
          {gameStarted && !gameOver && <button type="button" onClick={() => requestAction('giveUp')} disabled={blocked} className="btn-ghost">{t('game.giveUp')}</button>}
          {guessCount === 0 && <button type="button" onClick={() => { resetInput(); onRandomStart(); }} disabled={blocked || gameOver} className="btn-ghost">{t('game.randomStart')}</button>}
          {guessCount > 0 && <button type="button" onClick={() => requestAction('restart')} disabled={blocked} className="btn-ghost">{t('game.restart')}</button>}
        </div>
      </div>
      {confirm && (
        <div className="action-confirmation" role="group" aria-label={t(`game.${confirm === 'giveUp' ? 'confirmGiveUp' : 'confirmRestart'}`)}>
          <p>{t(`game.${confirm === 'giveUp' ? 'confirmGiveUp' : 'confirmRestart'}`)}</p>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => setConfirm(null)}>{t('common.cancel')}</button>
            <button type="button" className="btn-danger" onClick={() => {
              const action = confirm; resetInput();
              if (action === 'giveUp') onGiveUp(); else onRestart();
            }}>{t('game.confirmAction')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
