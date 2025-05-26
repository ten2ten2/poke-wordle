'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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

  const handlePranksterToggle = () => {
    setLocalSettings(prev => ({ ...prev, isPrankster: !prev.isPrankster }));
  };

  const handleGenArrowToggle = () => {
    setLocalSettings(prev => ({ ...prev, isGenArrow: !prev.isGenArrow }));
  };

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
              <Dialog.Panel className="modal-content">
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

                  {/* Settings Form */}
                  <div className="form-group-mobile">
                    {/* Max Guesses */}
                    <div className="space-y-3">
                      <label className="block text-responsive-sm font-medium text-gray-700">
                        {t('settings.maxGuesses')}
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                        {[6, 8, 10, 12, 15].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleMaxGuessesChange(value)}
                            className={`touch-target px-3 py-2 text-responsive-sm font-medium rounded-md border transition-colors duration-200 ${
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
                      className="btn-primary w-full sm:w-auto"
                    >
                      {t('common.save')}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 