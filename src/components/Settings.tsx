'use client';

import { useState } from 'react';
import { DialogTitle } from '@headlessui/react';
import Modal from './Modal';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { GameSettings } from '@/types/pokemon';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: GameSettings) => void;
  currentSettings: GameSettings;
}

export default function Settings(props: SettingsProps) {
  return (
    <SettingsForm
      key={`${props.isOpen}-${JSON.stringify(props.currentSettings)}`}
      {...props}
    />
  );
}

function SettingsForm({
  isOpen,
  onClose,
  onSettingsChange,
  currentSettings,
}: SettingsProps) {
  const t = useTranslations();
  const [localSettings, setLocalSettings] =
    useState<GameSettings>(currentSettings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(currentSettings);
    onClose();
  };

  const handleMaxGuessesChange = (value: number) => {
    setLocalSettings((prev) => ({ ...prev, maxGuesses: value }));
  };

  const handleGenerationToggle = (generation: number) => {
    setLocalSettings((prev) => {
      const newGenerations = prev.selectedGenerations.includes(generation)
        ? prev.selectedGenerations.filter((g) => g !== generation)
        : [...prev.selectedGenerations, generation].sort((a, b) => a - b);
      return { ...prev, selectedGenerations: newGenerations };
    });
  };

  const handleSelectAllGenerations = () => {
    setLocalSettings((prev) => ({
      ...prev,
      selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    }));
  };

  const handleDeselectAllGenerations = () => {
    setLocalSettings((prev) => ({ ...prev, selectedGenerations: [] }));
  };

  const handlePranksterToggle = () => {
    setLocalSettings((prev) => ({ ...prev, isPrankster: !prev.isPrankster }));
  };

  const handleGenArrowToggle = () => {
    setLocalSettings((prev) => ({ ...prev, isGenArrow: !prev.isGenArrow }));
  };

  const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const guessOptions = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-2xl">
      <article className="card-padding">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <DialogTitle
            as="h2"
            className="text-responsive-lg font-medium leading-6 text-foreground"
          >
            {t('settings.title')}
          </DialogTitle>
          <nav aria-label={t('common.close')}>
            <button
              type="button"
              className="btn-icon"
              onClick={handleCancel}
              aria-label={t('common.close')}
            >
              <XMarkIcon aria-hidden="true" />
            </button>
          </nav>
        </header>

        {/* Content */}
        <main className="space-y-6">
          <form className="space-y-6">
            {/* Guess Order */}
            <fieldset className="space-y-3">
              <legend className="block text-responsive-sm font-medium text-secondary">
                {t('settings.guessOrder')}
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-pressed={localSettings.guessOrder === 'reverse'}
                  onClick={() =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      guessOrder: 'reverse',
                    }))
                  }
                  className="btn-option"
                >
                  <div className="text-center">
                    <div>
                      {t('settings.reverseOrder')}
                    </div>
                    <div className="text-xs font-normal opacity-75 mt-1">
                      {t('settings.reverseOrderDesc')}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  aria-pressed={localSettings.guessOrder === 'normal'}
                  onClick={() =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      guessOrder: 'normal',
                    }))
                  }
                  className="btn-option"
                >
                  <div className="text-center">
                    <div>
                      {t('settings.normalOrder')}
                    </div>
                    <div className="text-xs font-normal opacity-75 mt-1">
                      {t('settings.normalOrderDesc')}
                    </div>
                  </div>
                </button>
              </div>
            </fieldset>

            {/* Max Guesses */}
            <fieldset className="space-y-3">
              <legend className="block text-responsive-sm font-medium text-secondary">
                {t('settings.maxGuesses')} ({localSettings.maxGuesses}{' '}
                {t('settings.times')})
              </legend>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {guessOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={localSettings.maxGuesses === value}
                    onClick={() => handleMaxGuessesChange(value)}
                    className="btn-option"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Generation Selection */}
            <fieldset className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <legend className="block text-responsive-sm font-medium text-secondary">
                  {t('settings.generationSelection')}
                </legend>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllGenerations}
                    className="btn-ghost"
                  >
                    {t('settings.selectAll')}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeselectAllGenerations}
                    className="btn-ghost"
                  >
                    {t('settings.deselectAll')}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {generations.map((gen) => (
                  <button
                    key={gen}
                    type="button"
                    aria-pressed={localSettings.selectedGenerations.includes(
                      gen,
                    )}
                    onClick={() => handleGenerationToggle(gen)}
                    className="btn-option"
                  >
                    {t(`generation.Gen${gen}`)}
                  </button>
                ))}
              </div>
              {localSettings.selectedGenerations.length === 0 && (
                <p className="text-xs text-danger">
                  {t('settings.generationRequired')}
                </p>
              )}
            </fieldset>

            {/* Generation Arrow */}
            <fieldset className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                  <input
                    id="genArrow"
                    type="checkbox"
                    checked={localSettings.isGenArrow}
                    onChange={handleGenArrowToggle}
                    className="h-4 w-4 accent-accent text-accent-text focus:ring-focus border-control rounded"
                  />
                </div>
                <div className="flex-1">
                  <legend className="text-responsive-sm font-medium text-secondary">
                    <label htmlFor="genArrow">{t('settings.genArrow')}</label>
                  </legend>
                  <p className="text-responsive-sm text-muted mt-1">
                    {t('settings.genArrowDesc')}
                  </p>
                </div>
              </div>
            </fieldset>

            {/* Prankster Mode */}
            <fieldset className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                  <input
                    id="prankster"
                    type="checkbox"
                    checked={localSettings.isPrankster}
                    onChange={handlePranksterToggle}
                    className="h-4 w-4 accent-accent text-accent-text focus:ring-focus border-control rounded"
                  />
                </div>
                <div className="flex-1">
                  <legend className="text-responsive-sm font-medium text-secondary">
                    <label htmlFor="prankster">
                      {t('settings.pranksterMode')}
                    </label>
                  </legend>
                  <p className="text-responsive-sm text-muted mt-1">
                    {t('settings.pranksterModeDesc')}
                  </p>
                </div>
              </div>
            </fieldset>

            {/* Action Buttons */}
            <section className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary w-full sm:w-auto"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={localSettings.selectedGenerations.length === 0}
                className="btn-primary w-full sm:w-auto"
              >
                {t('common.save')}
              </button>
            </section>
          </form>
        </main>
      </article>
    </Modal>
  );
}
