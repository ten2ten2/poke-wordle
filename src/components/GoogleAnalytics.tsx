'use client';

import { useEffect, useState, useCallback } from 'react';
import { hasUserDeclinedCookies } from './CookieConsent';

// 声明全局 gtag 函数
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
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

// 延迟加载 Google Analytics 脚本
const loadGoogleAnalytics = (measurementId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 检查脚本是否已经加载
    if (document.querySelector(`script[src*="gtag/js?id=${measurementId}"]`)) {
      resolve();
      return;
    }

    // 创建并加载 gtag 脚本
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.onload = () => {
      // 初始化 dataLayer 和 gtag 函数
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      };
      
      // 设置初始配置
      gtag('js', new Date());
      resolve();
    };
    script.onerror = reject;
    
    document.head.appendChild(script);
  });
};

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const [isClientSide, setIsClientSide] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side to prevent hydration mismatch
    setIsClientSide(true);
  }, []);

  const initializeAnalytics = useCallback(async () => {
    if (!isClientSide || isLoaded) return;

    try {
      // 延迟加载 GA 脚本
      await loadGoogleAnalytics(measurementId);
      setIsLoaded(true);

      // 根据用户同意状态配置 GA
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
    } catch (error) {
      console.warn('Failed to load Google Analytics:', error);
    }
  }, [measurementId, isClientSide, isLoaded]);

  useEffect(() => {
    // 使用 Intersection Observer 或延迟加载策略
    // 在用户开始与页面交互时才加载 GA
    const loadOnInteraction = () => {
      initializeAnalytics();
      // 移除事件监听器，只加载一次
      document.removeEventListener('scroll', loadOnInteraction);
      document.removeEventListener('mousemove', loadOnInteraction);
      document.removeEventListener('touchstart', loadOnInteraction);
      document.removeEventListener('click', loadOnInteraction);
    };

    if (isClientSide) {
      // 延迟 2 秒后加载，或在用户交互时立即加载
      const timeoutId = setTimeout(initializeAnalytics, 2000);
      
      // 监听用户交互事件
      document.addEventListener('scroll', loadOnInteraction, { passive: true });
      document.addEventListener('mousemove', loadOnInteraction, { passive: true });
      document.addEventListener('touchstart', loadOnInteraction, { passive: true });
      document.addEventListener('click', loadOnInteraction, { passive: true });

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('scroll', loadOnInteraction);
        document.removeEventListener('mousemove', loadOnInteraction);
        document.removeEventListener('touchstart', loadOnInteraction);
        document.removeEventListener('click', loadOnInteraction);
      };
    }
  }, [isClientSide, initializeAnalytics]);

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