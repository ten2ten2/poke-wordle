'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// 动态导入大型组件，减少初始包大小
export const DynamicGameOverModal = dynamic(
  () => import('./GameOverModal'),
  {
    loading: () => null, // 不显示加载状态
    ssr: false,
  }
);

export const DynamicSettings = dynamic(
  () => import('./Settings'),
  {
    loading: () => null, // 不显示加载状态
    ssr: false,
  }
);

export const DynamicAbout = dynamic(
  () => import('./About'),
  {
    loading: () => null, // 不显示加载状态
    ssr: false,
  }
);

export const DynamicCookieConsent = dynamic(
  () => import('./CookieConsent'),
  {
    loading: () => null, // Cookie consent doesn't need a loading state
    ssr: false,
  }
);

// 动态导入知识相关组件
export const DynamicKnowledgeArchive = dynamic(
  () => import('./KnowledgeArchive'),
  {
    loading: () => null,
    ssr: true, // Knowledge pages can be SSR'd
  }
);

export const DynamicRandomKnowledge = dynamic(
  () => import('./RandomKnowledge'),
  {
    loading: () => null,
    ssr: true,
  }
);

// 动态导入广告组件（如果需要）
export const DynamicGoogleAdSense = dynamic(
  () => import('./GoogleAdSense'),
  {
    loading: () => null,
    ssr: false,
  }
);

export const DynamicAdSidebar = dynamic(
  () => import('./AdSidebar'),
  {
    loading: () => null,
    ssr: false,
  }
);

// 类型定义
export type DynamicComponentProps<T = Record<string, unknown>> = T & {
  fallback?: ComponentType;
};

// 通用的动态组件加载器
export const createDynamicComponent = <T extends Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options?: {
    loading?: () => JSX.Element | null;
    ssr?: boolean;
  }
) => {
  return dynamic(importFn, {
    loading: options?.loading || (() => null),
    ssr: options?.ssr ?? false,
  });
}; 