'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Pokemon } from '@/types/pokemon';
import Image from 'next/image';

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
  maxGuesses
}: GameOverModalProps) {
  const t = useTranslations();

  const handleRestart = () => {
    onRestart();
    onClose();
  };

  if (!targetPokemon) return null;

  const getTypeColor = (type: string) => {
    // 多语言类型映射到统一的颜色
    const typeColorMap: { [key: string]: string } = {
      // 一般系 - Normal
      'normal': 'bg-gray-400',
      '一般': 'bg-gray-400',
      'ノーマル': 'bg-gray-400',
      '노말': 'bg-gray-400',
      'normale': 'bg-gray-400',
      
      // 火系 - Fire
      'fire': 'bg-orange-500',
      '火': 'bg-orange-500',
      'ほのお': 'bg-orange-500',
      '불꽃': 'bg-orange-500',
      'feu': 'bg-orange-500',
      'fuoco': 'bg-orange-500',
      'fuego': 'bg-orange-500',
      'feuer': 'bg-orange-500',
      
      // 水系 - Water
      'water': 'bg-blue-500',
      '水': 'bg-blue-500',
      'みず': 'bg-blue-500',
      '물': 'bg-blue-500',
      'eau': 'bg-blue-500',
      'acqua': 'bg-blue-500',
      'agua': 'bg-blue-500',
      'wasser': 'bg-blue-500',
      
      // 电系 - Electric
      'electric': 'bg-yellow-400',
      '电': 'bg-yellow-400',
      '電': 'bg-yellow-400',
      'でんき': 'bg-yellow-400',
      '전기': 'bg-yellow-400',
      'électrik': 'bg-yellow-400',
      'elettro': 'bg-yellow-400',
      'eléctrico': 'bg-yellow-400',
      'elektro': 'bg-yellow-400',
      
      // 草系 - Grass
      'grass': 'bg-green-500',
      '草': 'bg-green-500',
      'くさ': 'bg-green-500',
      '풀': 'bg-green-500',
      'plante': 'bg-green-500',
      'erba': 'bg-green-500',
      'planta': 'bg-green-500',
      'pflanze': 'bg-green-500',
      
      // 冰系 - Ice
      'ice': 'bg-cyan-300',
      '冰': 'bg-cyan-300',
      'こおり': 'bg-cyan-300',
      '얼음': 'bg-cyan-300',
      'glace': 'bg-cyan-300',
      'ghiaccio': 'bg-cyan-300',
      'hielo': 'bg-cyan-300',
      'eis': 'bg-cyan-300',
      
      // 格斗系 - Fighting
      'fighting': 'bg-red-600',
      '格斗': 'bg-red-600',
      '格鬥': 'bg-red-600',
      'かくとう': 'bg-red-600',
      '격투': 'bg-red-600',
      'combat': 'bg-red-600',
      'lotta': 'bg-red-600',
      'lucha': 'bg-red-600',
      'kampf': 'bg-red-600',
      
      // 毒系 - Poison
      'poison': 'bg-purple-500',
      '毒': 'bg-purple-500',
      'どく': 'bg-purple-500',
      '독': 'bg-purple-500',
      'veleno': 'bg-purple-500',
      'veneno': 'bg-purple-500',
      'gift': 'bg-purple-500',
      
      // 地面系 - Ground
      'ground': 'bg-amber-600',
      '地面': 'bg-amber-600',
      'じめん': 'bg-amber-600',
      '땅': 'bg-amber-600',
      'sol': 'bg-amber-600',
      'terra': 'bg-amber-600',
      'tierra': 'bg-amber-600',
      'boden': 'bg-amber-600',
      
      // 飞行系 - Flying
      'flying': 'bg-sky-400',
      '飞行': 'bg-sky-400',
      '飛行': 'bg-sky-400',
      'ひこう': 'bg-sky-400',
      '비행': 'bg-sky-400',
      'vol': 'bg-sky-400',
      'volante': 'bg-sky-400',
      'volador': 'bg-sky-400',
      'flug': 'bg-sky-400',
      
      // 超能力系 - Psychic
      'psychic': 'bg-pink-500',
      '超能力': 'bg-pink-500',
      'エスパー': 'bg-pink-500',
      '에스퍼': 'bg-pink-500',
      'psy': 'bg-pink-500',
      'psico': 'bg-pink-500',
      'psíquico': 'bg-pink-500',
      'psycho': 'bg-pink-500',
      
      // 虫系 - Bug
      'bug': 'bg-lime-500',
      '虫': 'bg-lime-500',
      '蟲': 'bg-lime-500',
      'むし': 'bg-lime-500',
      '벌레': 'bg-lime-500',
      'insecte': 'bg-lime-500',
      'coleottero': 'bg-lime-500',
      'bicho': 'bg-lime-500',
      'käfer': 'bg-lime-500',
      
      // 岩石系 - Rock
      'rock': 'bg-stone-600',
      '岩石': 'bg-stone-600',
      '岩': 'bg-stone-600',
      'いわ': 'bg-stone-600',
      '바위': 'bg-stone-600',
      'roche': 'bg-stone-600',
      'roccia': 'bg-stone-600',
      'roca': 'bg-stone-600',
      'gestein': 'bg-stone-600',
      
      // 幽灵系 - Ghost
      'ghost': 'bg-indigo-700',
      '幽灵': 'bg-indigo-700',
      '幽靈': 'bg-indigo-700',
      'ゴースト': 'bg-indigo-700',
      '고스트': 'bg-indigo-700',
      'spectre': 'bg-indigo-700',
      'spettro': 'bg-indigo-700',
      'fantasma': 'bg-indigo-700',
      'geist': 'bg-indigo-700',
      
      // 龙系 - Dragon
      'dragon': 'bg-violet-600',
      '龙': 'bg-violet-600',
      '龍': 'bg-violet-600',
      'ドラゴン': 'bg-violet-600',
      '드래곤': 'bg-violet-600',
      'drago': 'bg-violet-600',
      'dragón': 'bg-violet-600',
      'drache': 'bg-violet-600',
      
      // 恶系 - Dark
      'dark': 'bg-gray-700',
      '恶': 'bg-gray-700',
      '惡': 'bg-gray-700',
      'あく': 'bg-gray-700',
      '악': 'bg-gray-700',
      'ténèbres': 'bg-gray-700',
      'buio': 'bg-gray-700',
      'siniestro': 'bg-gray-700',
      'unlicht': 'bg-gray-700',
      
      // 钢系 - Steel
      'steel': 'bg-slate-500',
      '钢': 'bg-slate-500',
      '鋼': 'bg-slate-500',
      'はがね': 'bg-slate-500',
      '강철': 'bg-slate-500',
      'acier': 'bg-slate-500',
      'acciaio': 'bg-slate-500',
      'acero': 'bg-slate-500',
      'stahl': 'bg-slate-500',
      
      // 妖精系 - Fairy
      'fairy': 'bg-pink-400',
      '妖精': 'bg-pink-400',
      'フェアリー': 'bg-pink-400',
      '페어리': 'bg-pink-400',
      'fée': 'bg-pink-400',
      'folletto': 'bg-pink-400',
      'hada': 'bg-pink-400',
      'fee': 'bg-pink-400'
    };
    
    return typeColorMap[type.toLowerCase()] || 'bg-gray-400';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                    <Dialog.Title as="h3" className="text-responsive-xl font-bold text-gray-900">
                      {isWon ? t('game.congratulations') : t('game.gameOver')}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="touch-target rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={onClose}
                      aria-label={t('common.close')}
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Pokemon Display */}
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40">
                        <Image
                          src={targetPokemon.profile}
                          alt={targetPokemon.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 96px, (max-width: 1024px) 128px, 160px"
                          priority
                        />
                      </div>
                    </div>
                    
                    <h4 className="text-responsive-lg font-bold text-gray-900 mb-2">
                      {targetPokemon.name}
                    </h4>
                    
                    {/* Types with colors */}
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {targetPokemon.types.map((type, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getTypeColor(type)}`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>

                    {/* Pokemon Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Generation */}
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">
                            {t('game.columns.generation')}
                          </div>
                          <div className="text-base font-semibold text-gray-900">
                            {t(`generation.Gen${targetPokemon.generation}`)}
                          </div>
                        </div>

                        {/* Base Stats Total */}
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">
                            {t('game.columns.baseStats')}
                          </div>
                          <div className="text-base font-semibold text-gray-900">
                            {targetPokemon.base_stats_total}
                          </div>
                        </div>

                        {/* Evolution Stage */}
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">
                            {t('game.columns.evolution')}
                          </div>
                          <div className="text-base font-semibold text-gray-900">
                            {t(`evolution.stage${targetPokemon.evolution_stage}`)}
                          </div>
                        </div>

                        {/* Evolution Method */}
                        {targetPokemon.evolution_method_detail && (
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">
                              {t('game.evolutionMethod')}
                            </div>
                            <div className="text-base font-semibold text-gray-900">
                              {t(`evolutionMethods.${targetPokemon.evolution_method_detail}`)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Abilities */}
                      <div className="mt-4">
                        <div className="text-sm font-medium text-gray-500 mb-2">
                          {t('game.columns.abilities')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {targetPokemon.abilities.map((ability, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                            >
                              {ability}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Tags */}
                      {targetPokemon.tags && targetPokemon.tags.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm font-medium text-gray-500 mb-2">
                            {t('game.columns.tags')}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {targetPokemon.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                              >
                                {t(`tags.${tag}`)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Game Stats */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-responsive-sm text-gray-500">
                          {t('game.guessesUsed')}
                        </div>
                        <div className="text-responsive-lg font-bold text-gray-900">
                          {guessCount} / {maxGuesses}
                        </div>
                      </div>
                      <div>
                        <div className="text-responsive-sm text-gray-500">
                          {t('game.result')}
                        </div>
                        <div className={`text-responsive-lg font-bold ${
                          isWon ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isWon ? t('game.gameWon') : t('game.defeat')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Result Message */}
                  <div className="text-center mb-6">
                    {isWon ? (
                      <p className="text-responsive-base text-gray-700">
                        {guessCount === 1 
                          ? t('game.guessedIn', { count: 1 })
                          : t('game.guessedIn', { count: guessCount })
                        }
                      </p>
                    ) : (
                      <p className="text-responsive-base text-gray-700">
                        {t('game.betterLuckNextTime')}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={handleRestart}
                      className="btn-primary flex-1"
                    >
                      {t('game.playAgain')}
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