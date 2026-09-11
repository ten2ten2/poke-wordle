'use client';

import { DialogTitle } from '@headlessui/react';
import Modal from './Modal';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AboutProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function About({ isOpen, onClose }: AboutProps) {
  const t = useTranslations();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <article className="card-padding">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <DialogTitle
            as="h2"
            className="text-responsive-lg font-medium leading-6 text-foreground"
          >
            {t('about.title')}
          </DialogTitle>
          <nav aria-label={t('common.close')}>
            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              <XMarkIcon aria-hidden="true" />
            </button>
          </nav>
        </header>

        {/* Content */}
        <div className="space-y-6 leading-relaxed">
          {/* 主标题和描述 */}
          <section>
            <p className="text-secondary">{t('about.description')}</p>
          </section>

          {/* 游戏玩法 */}
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              {t('about.howToPlay')}
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-secondary">
              {t.raw('about.rules').map((rule: string, index: number) => (
                <li key={index}>{rule}</li>
              ))}
            </ol>
          </section>

          {/* 宝可梦范围 */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {t('about.pokemonRange.title')}
            </h3>
            <p className="text-secondary mb-3">
              {t('about.pokemonRange.description')}
            </p>
            <ul className="space-y-1 text-sm text-secondary ml-4" role="list">
              <li>{t('about.pokemonRange.generations.gen1')}</li>
              <li>{t('about.pokemonRange.generations.gen2')}</li>
              <li>{t('about.pokemonRange.generations.gen3')}</li>
              <li>{t('about.pokemonRange.generations.gen4')}</li>
              <li>{t('about.pokemonRange.generations.gen5')}</li>
              <li>{t('about.pokemonRange.generations.gen6')}</li>
              <li>{t('about.pokemonRange.generations.gen7')}</li>
              <li>{t('about.pokemonRange.generations.gen8')}</li>
              <li>{t('about.pokemonRange.generations.gen9')}</li>
            </ul>
            <p className="text-secondary mt-3">{t('about.pokemonRange.note')}</p>
          </section>

          {/* 标签颜色说明 */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {t('about.colorGuide.title')}
            </h3>
            <ul className="space-y-3 text-sm leading-relaxed">
              {(['green', 'yellow', 'gray'] as const).map((color) => (
                <li key={color} className="text-secondary">
                  {t.rich(`about.colorGuide.${color}`, {
                    tag: (chunks) => (
                      <strong className={`tag font-semibold tag-${{ green: 'exact', yellow: 'close', gray: 'nope' }[color]}`}>
                        {chunks}
                      </strong>
                    ),
                  })}
                </li>
              ))}
            </ul>
          </section>

          {/* 黄色标签判断条件 */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {t('about.yellowConditions.title')}
            </h3>
            <ul className="space-y-2 text-sm text-secondary ml-4" role="list">
              <li>{t('about.yellowConditions.stats')}</li>
              <li>{t('about.yellowConditions.generation')}</li>
              <li>{t('about.yellowConditions.evolution')}</li>
            </ul>
          </section>

          {/* 数据来源 */}
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              {t('about.dataSource.title')}
            </h3>
            <p className="text-secondary">
              {t.rich('about.dataSource.description', {
                pokeapi: (chunks) => <a title="PokéAPI" href="https://pokeapi.co" target="_blank" rel="noopener noreferrer" className="text-accent-text underline underline-offset-2">{chunks}</a>,
                bulbapedia: (chunks) => <a title="Bulbapedia" href="https://bulbapedia.bulbagarden.net/wiki/Main_Page" target="_blank" rel="noopener noreferrer" className="text-accent-text underline underline-offset-2">{chunks}</a>,
              })}
            </p>
          </section>
        </div>
      </article>
    </Modal>
  );
}
