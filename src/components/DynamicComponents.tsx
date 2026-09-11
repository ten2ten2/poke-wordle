'use client';

import dynamic from 'next/dynamic';

export const DynamicGameOverModal = dynamic(() => import('./GameOverModal'), {
  ssr: false,
});
export const DynamicSettings = dynamic(() => import('./Settings'), {
  ssr: false,
});
export const DynamicAbout = dynamic(() => import('./About'), { ssr: false });
