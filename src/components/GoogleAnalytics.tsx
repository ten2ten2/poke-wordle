'use client';

import { useEffect } from 'react';
import { hasUserConsentedToCookies } from './CookieConsent';

// 声明全局 gtag 函数
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

// gtag 函数的类型安全包装
const gtag = (...args: unknown[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
};

interface GoogleAnalyticsProps {
  measurementId: string;
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // 只有在用户同意的情况下才初始化 Google Analytics
    if (hasUserConsentedToCookies()) {
      gtag('config', measurementId, {
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }, [measurementId]);

  return null;
}

// 用于跟踪页面浏览的函数
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && hasUserConsentedToCookies()) {
    gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      page_title: title || document.title,
      page_location: url,
    });
  }
};

// 用于跟踪自定义事件的函数
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && hasUserConsentedToCookies()) {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// 游戏相关的事件跟踪函数
export const trackGameEvent = {
  // 游戏开始
  gameStart: () => {
    trackEvent('game_start', 'game', 'poke_wordle');
  },
  
  // 游戏完成
  gameComplete: (attempts: number, success: boolean, pokemon: string) => {
    trackEvent('game_complete', 'game', pokemon, attempts);
    trackEvent(success ? 'game_win' : 'game_lose', 'game', pokemon, attempts);
  },
  
  // 语言切换
  languageChange: (language: string) => {
    trackEvent('language_change', 'ui', language);
  },
  
  // 分享游戏结果
//   shareResult: (platform: string) => {
//     trackEvent('share_result', 'social', platform);
//   },
}; 