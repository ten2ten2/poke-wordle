'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { GameSettings } from '@/types/pokemon';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: GameSettings) => void;
  currentSettings: GameSettings;
}

export default function Settings({ isOpen, onClose, onSettingsChange, currentSettings }: SettingsProps) {
  const t = useTranslations();
  const [localSettings, setLocalSettings] = useState<GameSettings>(currentSettings);

  useEffect(() => {
    setLocalSettings(currentSettings);
  }, [currentSettings, isOpen]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(currentSettings);
    onClose();
  };

  const handleMaxGuessesChange = (value: number) => {
    setLocalSettings(prev => ({ ...prev, maxGuesses: value }));
  };

  const handleGenerationToggle = (generation: number) => {
    setLocalSettings(prev => {
      const newGenerations = prev.selectedGenerations.includes(generation)
        ? prev.selectedGenerations.filter(g => g !== generation)
        : [...prev.selectedGenerations, generation].sort();
      return { ...prev, selectedGenerations: newGenerations };
    });
  };

  const handleSelectAllGenerations = () => {
    setLocalSettings(prev => ({ ...prev, selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9] }));
  };

  const handleDeselectAllGenerations = () => {
    setLocalSettings(prev => ({ ...prev, selectedGenerations: [] }));
  };

  const handlePranksterToggle = () => {
    setLocalSettings(prev => ({ ...prev, isPrankster: !prev.isPrankster }));
  };

  const handleGenArrowToggle = () => {
    setLocalSettings(prev => ({ ...prev, isGenArrow: !prev.isGenArrow }));
  };

  const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const guessOptions = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleCancel}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto safe-all">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="modal-content max-w-2xl">
                <article className="card-padding">
                  {/* Header */}
                  <header className="flex items-center justify-between mb-6">
                    <DialogTitle as="h2" className="text-responsive-lg font-medium leading-6 text-gray-900">
                      {t('settings.title')}
                    </DialogTitle>
                    <nav aria-label={t('common.close')}>
                      <button
                        type="button"
                        className="touch-target rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={handleCancel}
                        aria-label={t('common.close')}
                      >
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </nav>
                  </header>

                  {/* Content */}
                  <main className="space-y-6">
                    <form className="space-y-6">
                      {/* Guess Order */}
                      <fieldset className="space-y-3">
                        <legend className="block text-responsive-sm font-medium text-gray-700">
                          {t('settings.guessOrder')}
                        </legend>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setLocalSettings(prev => ({ ...prev, guessOrder: 'reverse' }))}
                            className={`touch-target px-4 py-3 text-responsive-sm font-medium rounded-md border transition-colors duration-200 ${localSettings.guessOrder === 'reverse'
                              ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                              }`}
                          >
                            <div className="text-center">
                              <div className="font-medium">{t('settings.reverseOrder')}</div>
                              <div className="text-xs opacity-75 mt-1">{t('settings.reverseOrderDesc')}</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLocalSettings(prev => ({ ...prev, guessOrder: 'normal' }))}
                            className={`touch-target px-4 py-3 text-responsive-sm font-medium rounded-md border transition-colors duration-200 ${localSettings.guessOrder === 'normal'
                              ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                              }`}
                          >
                            <div className="text-center">
                              <div className="font-medium">{t('settings.normalOrder')}</div>
                              <div className="text-xs opacity-75 mt-1">{t('settings.normalOrderDesc')}</div>
                            </div>
                          </button>
                        </div>
                      </fieldset>

                      {/* Max Guesses */}
                      <fieldset className="space-y-3">
                        <legend className="block text-responsive-sm font-medium text-gray-700">
                          {t('settings.maxGuesses')} ({localSettings.maxGuesses} {t('settings.times')})
                        </legend>
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                          {guessOptions.map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => handleMaxGuessesChange(value)}
                              className={`touch-target px-2 py-2 text-responsive-sm font-medium rounded-md border transition-colors duration-200 ${localSettings.maxGuesses === value
                                ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      {/* Generation Selection */}
                      <fieldset className="space-y-3">
                        <div className="flex items-center justify-between">
                          <legend className="block text-responsive-sm font-medium text-gray-700">
                            {t('settings.generationSelection')}
                          </legend>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={handleSelectAllGenerations}
                              className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                            >
                              {t('settings.selectAll')}
                            </button>

                            <button
                              type="button"
                              onClick={handleDeselectAllGenerations}
                              className="text-xs text-blue-500 hover:text-blue-700 font-medium"
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
                              onClick={() => handleGenerationToggle(gen)}
                              className={`touch-target px-3 py-2 text-responsive-sm font-medium rounded-md border transition-colors duration-200 ${localSettings.selectedGenerations.includes(gen)
                                ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                            >
                              {t(`generation.Gen${gen}`)}
                            </button>
                          ))}
                        </div>
                        {localSettings.selectedGenerations.length === 0 && (
                          <p className="text-xs text-red-600">
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
                              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex-1">
                            <legend className="text-responsive-sm font-medium text-gray-700">
                              <label htmlFor="genArrow">{t('settings.genArrow')}</label>
                            </legend>
                            <p className="text-responsive-sm text-gray-500 mt-1">
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
                              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex-1">
                            <legend className="text-responsive-sm font-medium text-gray-700">
                              <label htmlFor="prankster">{t('settings.pranksterMode')}</label>
                            </legend>
                            <p className="text-responsive-sm text-gray-500 mt-1">
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
                          className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('common.save')}
                        </button>
                      </section>
                    </form>
                  </main>
                </article>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 