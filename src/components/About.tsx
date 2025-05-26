'use client';

import { useTranslations } from 'next-intl';

export default function About() {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('about.title')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('about.description')}
        </p>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-2">
          {t('about.howToPlay')}
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          {t.raw('about.rules').map((rule: string, index: number) => (
            <li key={index}>{rule}</li>
          ))}
        </ol>
      </div>
    </div>
  );
} 