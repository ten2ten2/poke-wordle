'use client';

import { useTranslations } from 'next-intl';

export default function About() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      {/* 主标题和描述 */}
      <div>
        <p className="text-gray-600">
          {t('about.description')}
        </p>
      </div>

      {/* 游戏玩法 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {t('about.howToPlay')}
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          {t.raw('about.rules').map((rule: string, index: number) => (
            <li key={index}>{rule}</li>
          ))}
        </ol>
      </div>

      {/* 宝可梦范围 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {t('about.pokemonRange.title')}
        </h3>
        <p className="text-gray-600 mb-3">
          {t('about.pokemonRange.description')}
        </p>
        <ul className="space-y-1 text-sm text-gray-600 ml-4">
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
        <p className="text-gray-600 mt-3">
          {t('about.pokemonRange.note')}
        </p>
      </div>

      {/* 标签颜色说明 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {t('about.colorGuide.title')}
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-1 items-center">
            <span className="tag tag-exact">{t('about.colorGuide.greenTag')}</span>
            <span 
              className="text-gray-600"
              dangerouslySetInnerHTML={{ 
                __html: t('about.colorGuide.green')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }}
            />
          </li>
          <li className="flex gap-1 items-center">
            <span className="tag tag-close">{t('about.colorGuide.yellowTag')}</span>
            <span 
              className="text-gray-600"
              dangerouslySetInnerHTML={{ 
                __html: t('about.colorGuide.yellow')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }}
            />
          </li>
          <li className="flex gap-1 items-center">
            <span className="tag tag-nope">{t('about.colorGuide.grayTag')}</span>
            <span 
              className="text-gray-600"
              dangerouslySetInnerHTML={{ 
                __html: t('about.colorGuide.gray')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }}
            />
          </li>
        </ul>
      </div>

      {/* 黄色标签判断条件 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {t('about.yellowConditions.title')}
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 ml-4">
          <li>{t('about.yellowConditions.stats')}</li>
          <li>{t('about.yellowConditions.generation')}</li>
          <li>{t('about.yellowConditions.evolution')}</li>
        </ul>
      </div>

      {/* 数据来源 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {t('about.dataSource.title')}
        </h2>
        <div 
          className="text-gray-600"
          dangerouslySetInnerHTML={{ 
            __html: t('about.dataSource.description')
              .replace(/\[([^\]]+)\]\(([^)]+)\s+"([^"]+)"\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1" title="$3">$1<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>')
          }}
        />
      </div>
    </div>
  );
} 