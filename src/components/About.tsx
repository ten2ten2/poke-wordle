'use client';

import Modal, { ModalHeader } from './Modal';
import { useTranslations } from 'next-intl';

interface AboutProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function About({ isOpen, onClose }: AboutProps) {
  const t = useTranslations();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <article className="card-padding space-y-5">
        <ModalHeader title={t('about.title')} onClose={onClose} />

        <div className="space-y-6 text-sm leading-relaxed sm:text-base [overflow-wrap:anywhere] hyphens-auto">
          <section>
            <p className="text-secondary">{t('about.description')}</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {t('about.howToPlay')}
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-secondary">
              {t.raw('about.rules').map((rule: string, index: number) => (
                <li key={index}>{rule}</li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {t('about.pokemonRange.title')}
            </h3>
            <p className="text-secondary mb-3">
              {t('about.pokemonRange.description')}
            </p>
            <ul className="space-y-1 text-sm text-secondary ml-4" role="list">
              {Array.from({ length: 9 }, (_, index) => (
                <li key={index}>{t(`about.pokemonRange.generations.gen${index + 1}`)}</li>
              ))}
            </ul>
            <p className="text-secondary mt-3">{t('about.pokemonRange.note')}</p>
          </section>

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
                        <span className="tag-label">{chunks}</span>
                      </strong>
                    ),
                  })}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {t('about.yellowConditions.title')}
            </h3>
            <ul className="space-y-2 text-sm text-secondary ml-4" role="list">
              {['stats', 'generation', 'evolution'].map((condition) => (
                <li key={condition}>{t(`about.yellowConditions.${condition}`)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">
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
