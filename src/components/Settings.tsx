'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { GameSettings } from '@/types/pokemon';
import About from './About';

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
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto safe-all">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="modal-content max-w-2xl">
                <div className="card-padding">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title as="h3" className="text-responsive-lg font-medium leading-6 text-gray-900">
                      {t('settings.title')}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="touch-target rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={handleCancel}
                      aria-label={t('common.close')}
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <Tab.Group>
                    <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
                      <Tab
                        className={({ selected }) =>
                          `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${
                            selected
                              ? 'bg-white text-blue-700 shadow'
                              : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                          }`
                        }
                      >
                        {t('settings.settingsTab')}
                      </Tab>
                      <Tab
                        className={({ selected }) =>
                          `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${
                            selected
                              ? 'bg-white text-blue-700 shadow'
                              : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                          }`
                        }
                      >
                        {t('settings.aboutTab')}
                      </Tab>
                    </Tab.List>

                    <Tab.Panels>
                      {/* Settings Panel */}
                      <Tab.Panel>
                        <div className="form-group-mobile">
                          {/* Max Guesses */}
                          <div className="space-y-3">
                            <label className="block text-responsive-sm font-medium text-gray-700">
                              {t('settings.maxGuesses')} ({localSettings.maxGuesses} {t('settings.times')})
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                              {guessOptions.map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => handleMaxGuessesChange(value)}
                                  className={`touch-target px-2 py-2 text-responsive-sm font-medium rounded-md border transition-colors duration-200 ${
                                    localSettings.maxGuesses === value
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {value}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Generation Selection */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="block text-responsive-sm font-medium text-gray-700">
                                {t('settings.generationSelection')}
                              </label>
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={handleSelectAllGenerations}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  {t('settings.selectAll')}
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={handleDeselectAllGenerations}
                                  className="text-xs text-blue-600 hover:text-blue-800"
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
                                  className={`touch-target px-3 py-2 text-responsive-sm font-medium rounded-md border transition-colors duration-200 ${
                                    localSettings.selectedGenerations.includes(gen)
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
                          </div>

                          {/* Prankster Mode */}
                          <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                              <div className="flex items-center h-5">
                                <input
                                  id="prankster"
                                  type="checkbox"
                                  checked={localSettings.isPrankster}
                                  onChange={handlePranksterToggle}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </div>
                              <div className="flex-1">
                                <label htmlFor="prankster" className="text-responsive-sm font-medium text-gray-700">
                                  {t('settings.pranksterMode')}
                                </label>
                                <p className="text-responsive-sm text-gray-500 mt-1">
                                  {t('settings.pranksterModeDesc')}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Generation Arrow */}
                          <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                              <div className="flex items-center h-5">
                                <input
                                  id="genArrow"
                                  type="checkbox"
                                  checked={localSettings.isGenArrow}
                                  onChange={handleGenArrowToggle}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </div>
                              <div className="flex-1">
                                <label htmlFor="genArrow" className="text-responsive-sm font-medium text-gray-700">
                                  {t('settings.genArrow')}
                                </label>
                                <p className="text-responsive-sm text-gray-500 mt-1">
                                  {t('settings.genArrowDesc')}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Guess Order */}
                          <div className="space-y-3">
                            <label className="block text-responsive-sm font-medium text-gray-700">
                              {t('settings.guessOrder')}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setLocalSettings(prev => ({ ...prev, guessOrder: 'reverse' }))}
                                className={`touch-target px-4 py-3 text-responsive-sm font-medium rounded-md border transition-colors duration-200 ${
                                  localSettings.guessOrder === 'reverse'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
                                className={`touch-target px-4 py-3 text-responsive-sm font-medium rounded-md border transition-colors duration-200 ${
                                  localSettings.guessOrder === 'normal'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="text-center">
                                  <div className="font-medium">{t('settings.normalOrder')}</div>
                                  <div className="text-xs opacity-75 mt-1">{t('settings.normalOrderDesc')}</div>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4">
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
                        </div>
                      </Tab.Panel>

                      {/* About Panel */}
                      <Tab.Panel>
                        <About />
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 