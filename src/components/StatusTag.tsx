'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { ComparisonStatus } from '@/types/pokemon';

const symbols = { exact: '✓', close: '≈', nope: '×' };
const messages = { exact: 'matchExact', close: 'matchClose', nope: 'matchNope' };
const statusClasses = { exact: 'tag-exact', close: 'tag-close', nope: 'tag-nope' };

export default function StatusTag({ status, arrow, children }: {
  status: ComparisonStatus;
  arrow?: 'upper' | 'lower';
  children: ReactNode;
}) {
  const t = useTranslations('game');
  const description = [t(messages[status]), arrow && t(arrow === 'upper' ? 'answerHigher' : 'answerLower')].filter(Boolean).join(' · ');
  return (
    <span className={`tag ${statusClasses[status]}`} title={description}>
      <span aria-hidden="true" className="status-symbol">{symbols[status]}</span>
      <span>{children}</span>
      {arrow && <span aria-hidden="true">{arrow === 'upper' ? '↑' : '↓'}</span>}
      <span className="sr-only"> — {description}</span>
    </span>
  );
}

export function ColorLegend() {
  const t = useTranslations('game');
  return (
    <div className="color-legend">
      {(['exact', 'close', 'nope'] as const).map((status) => (
        <span key={status} className={`tag ${statusClasses[status]}`}>
          <span aria-hidden="true" className="status-symbol">{symbols[status]}</span>{t(messages[status])}
        </span>
      ))}
      <span className="legend-arrows"><span>↑ {t('answerHigher')}</span><span>↓ {t('answerLower')}</span></span>
    </div>
  );
}
