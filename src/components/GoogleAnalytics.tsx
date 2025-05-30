'use client';

import { useEffect, useState } from 'react';
import { hasUserDeclinedCookies } from './CookieConsent';

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
  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side to prevent hydration mismatch
    setIsClientSide(true);
  }, []);

  useEffect(() => {
    // Only run analytics logic on client side after hydration
    if (!isClientSide) return;

    // 默认初始化 Google Analytics，如果用户明确拒绝则关闭
    if (hasUserDeclinedCookies()) {
      // 用户拒绝了 Cookie，关闭 GA 追踪
      gtag('config', measurementId, {
        send_page_view: false,
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    } else {
      // 默认或用户同意的情况下，正常初始化 GA
      gtag('config', measurementId, {
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }, [measurementId, isClientSide]);

  return null;
}

// 用于跟踪页面浏览的函数
export const trackPageView = (url: string, title?: string) => {
  // 只有在用户没有明确拒绝的情况下才追踪
  if (typeof window !== 'undefined' && !hasUserDeclinedCookies()) {
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
  // 只有在用户没有明确拒绝的情况下才追踪
  if (typeof window !== 'undefined' && !hasUserDeclinedCookies()) {
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