'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GameSettings } from '@/types/pokemon';
import Modal, { ModalHeader } from './Modal';

const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const guessOptions = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const modes = [
  { key: 'isGenArrow', id: 'genArrow', label: 'genArrow', description: 'genArrowDesc' },
  { key: 'isPrankster', id: 'prankster', label: 'pranksterMode', description: 'pranksterModeDesc' },
] as const;

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: GameSettings) => void;
  currentSettings: GameSettings;
}

export default function Settings(props: SettingsProps) {
  return <SettingsForm key={`${props.isOpen}-${JSON.stringify(props.currentSettings)}`} {...props} />;
}

function SettingsForm({ isOpen, onClose, onSettingsChange, currentSettings }: SettingsProps) {
  const t = useTranslations();
  const [localSettings, setLocalSettings] = useState(currentSettings);
  const hasGenerations = localSettings.selectedGenerations.length > 0;

  const handleCancel = () => {
    setLocalSettings(currentSettings);
    onClose();
  };

  const handleGenerationToggle = (generation: number) => {
    setLocalSettings((prev) => ({
      ...prev,
      selectedGenerations: prev.selectedGenerations.includes(generation)
        ? prev.selectedGenerations.filter((value) => value !== generation)
        : [...prev.selectedGenerations, generation].sort((a, b) => a - b),
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-2xl">
      <div className="card-padding space-y-5">
        <ModalHeader title={t('settings.title')} onClose={handleCancel} />
        <form
          className="space-y-6 text-sm [overflow-wrap:anywhere] hyphens-auto"
          onSubmit={(event) => {
            event.preventDefault();
            if (!hasGenerations) return;
            onSettingsChange(localSettings);
            onClose();
          }}
        >
          <fieldset className="min-w-0 space-y-3">
            <legend className="font-semibold text-foreground">{t('settings.guessOrder')}</legend>
            <div className="grid grid-cols-2 gap-3">
              {(['reverse', 'normal'] as const).map((order) => (
                <button
                  key={order}
                  type="button"
                  title={t(`settings.${order}OrderDesc`)}
                  aria-pressed={localSettings.guessOrder === order}
                  onClick={() => setLocalSettings((prev) => ({ ...prev, guessOrder: order }))}
                  className="btn-option min-w-0"
                >
                  <span>
                    <span className="block">{t(`settings.${order}Order`)}</span>
                    <span className="mt-1 block text-xs font-normal opacity-75">{t(`settings.${order}OrderDesc`)}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="min-w-0 space-y-3">
            <legend className="font-semibold text-foreground">
              {t('settings.maxGuesses')} ({localSettings.maxGuesses})
            </legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {guessOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  title={`${t('settings.maxGuesses')}: ${value}`}
                  aria-pressed={localSettings.maxGuesses === value}
                  onClick={() => setLocalSettings((prev) => ({ ...prev, maxGuesses: value }))}
                  className="btn-option"
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="min-w-0 space-y-3" aria-describedby={!hasGenerations ? 'generation-required' : undefined}>
            <legend className="font-semibold text-foreground">{t('settings.generationSelection')}</legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings((prev) => ({ ...prev, selectedGenerations: generations }))}
                title={t('settings.selectAll')}
                className="btn-ghost"
              >
                {t('settings.selectAll')}
              </button>
              <button
                type="button"
                onClick={() => setLocalSettings((prev) => ({ ...prev, selectedGenerations: [] }))}
                title={t('settings.deselectAll')}
                className="btn-ghost"
              >
                {t('settings.deselectAll')}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {generations.map((gen) => (
                <button
                  key={gen}
                  type="button"
                  title={t(`generation.Gen${gen}`)}
                  aria-pressed={localSettings.selectedGenerations.includes(gen)}
                  onClick={() => handleGenerationToggle(gen)}
                  className="btn-option px-2"
                >
                  {t(`generation.Gen${gen}`)}
                </button>
              ))}
            </div>
            {!hasGenerations && <p id="generation-required" role="alert" className="text-danger">{t('settings.generationRequired')}</p>}
          </fieldset>

          {modes.map(({ key, id, label, description }) => (
            <label key={key} htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3">
              <input
                id={id}
                title={t(`settings.${description}`)}
                aria-labelledby={`${id}-label`}
                aria-describedby={`${id}-description`}
                type="checkbox"
                checked={localSettings[key]}
                onChange={(event) => {
                  const checked = event.currentTarget.checked;
                  setLocalSettings((prev) => ({ ...prev, [key]: checked }));
                }}
                className="mt-1 size-4 shrink-0 accent-accent"
              />
              <span className="min-w-0">
                <span id={`${id}-label`} className="block font-semibold text-foreground">{t(`settings.${label}`)}</span>
                <span id={`${id}-description`} className="mt-1 block text-muted">{t(`settings.${description}`)}</span>
              </span>
            </label>
          ))}

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleCancel} title={t('common.cancel')} className="btn-secondary w-full sm:w-auto">
              {t('common.cancel')}
            </button>
            <button type="submit" title={t('common.save')} disabled={!hasGenerations} className="btn-primary w-full sm:w-auto">
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
