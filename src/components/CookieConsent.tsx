'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// 声明全局 gtag 函数
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

interface CookieConsentProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

// 翻译消息类型
interface CookieConsentMessages {
  title: string;
  description: string;
  learnMore: string;
  accept: string;
  decline: string;
  close: string;
  privacyAndTerms: string;
}

// 所有语言的翻译消息 - 使用 Object.freeze 防止意外修改
const messages: Record<string, CookieConsentMessages> = Object.freeze({
  en: {
    title: "We use localStorage",
    description: "We use localStorage and similar technologies to improve your experience, analyze site usage, and assist with our marketing efforts. By continuing to use our site, you consent to our use of localStorage.",
    learnMore: "Learn more",
    accept: "Accept",
    decline: "Decline",
    close: "Close",
    privacyAndTerms: "Privacy Policy & Terms of Service"
  },
  ja: {
    title: "localStorage を使用しています",
    description: "私たちは localStorage と類似の技術を使用して、あなたの体験を向上させ、サイトの使用状況を分析し、マーケティング活動を支援しています。サイトの使用を続けることで、localStorage の使用に同意したものとみなされます。",
    learnMore: "詳細を見る",
    accept: "同意する",
    decline: "拒否する",
    close: "閉じる",
    privacyAndTerms: "プライバシーポリシー・利用規約"
  },
  fr: {
    title: "Nous utilisons localStorage",
    description: "Nous utilisons localStorage et des technologies similaires pour améliorer votre expérience, analyser l'utilisation du site et aider nos efforts de marketing. En continuant à utiliser notre site, vous consentez à notre utilisation de localStorage.",
    learnMore: "En savoir plus",
    accept: "Accepter",
    decline: "Refuser",
    close: "Fermer",
    privacyAndTerms: "Politique de confidentialité et conditions d'utilisation"
  },
  de: {
    title: "Wir verwenden localStorage",
    description: "Wir verwenden localStorage und ähnliche Technologien, um Ihre Erfahrung zu verbessern, die Website-Nutzung zu analysieren und unsere Marketing-Bemühungen zu unterstützen. Durch die weitere Nutzung unserer Website stimmen Sie der Verwendung von localStorage zu.",
    learnMore: "Mehr erfahren",
    accept: "Akzeptieren",
    decline: "Ablehnen",
    close: "Schließen",
    privacyAndTerms: "Datenschutzerklärung & Nutzungsbedingungen"
  },
  it: {
    title: "Utilizziamo localStorage",
    description: "Utilizziamo localStorage e tecnologie simili per migliorare la tua esperienza, analizzare l'utilizzo del sito e assistere i nostri sforzi di marketing. Continuando a utilizzare il nostro sito, acconsenti al nostro utilizzo di localStorage.",
    learnMore: "Scopri di più",
    accept: "Accetta",
    decline: "Rifiuta",
    close: "Chiudi",
    privacyAndTerms: "Informativa sulla Privacy e Termini di Servizio"
  },
  es: {
    title: "Usamos localStorage",
    description: "Usamos localStorage y tecnologías similares para mejorar su experiencia, analizar el uso del sitio y ayudar con nuestros esfuerzos de marketing. Al continuar usando nuestro sitio, usted consiente nuestro uso de localStorage.",
    learnMore: "Más información",
    accept: "Aceptar",
    decline: "Rechazar",
    close: "Cerrar",
    privacyAndTerms: "Política de Privacidad y Términos de Servicio"
  },
  ko: {
    title: "localStorage를 사용합니다",
    description: "저희는 localStorage와 유사한 기술을 사용하여 사용자 경험을 개선하고, 사이트 사용량을 분석하며, 마케팅 활동을 지원합니다. 사이트를 계속 사용하시면 localStorage 사용에 동의하는 것으로 간주됩니다.",
    learnMore: "자세히 알아보기",
    accept: "동의",
    decline: "거부",
    close: "닫기",
    privacyAndTerms: "개인정보 처리방침 및 이용약관"
  },
  'zh-hans': {
    title: "我们使用 localStorage",
    description: "我们使用 localStorage 和类似技术来改善您的体验、分析网站使用情况并协助我们的营销工作。通过继续使用我们的网站，您同意我们使用 localStorage。",
    learnMore: "了解更多",
    accept: "接受",
    decline: "拒绝",
    close: "关闭",
    privacyAndTerms: "隐私政策和服务条款"
  },
  'zh-hant': {
    title: "我們使用 localStorage",
    description: "我們使用 localStorage 和類似技術來改善您的體驗、分析網站使用情況並協助我們的行銷工作。通過繼續使用我們的網站，您同意我們使用 localStorage。",
    learnMore: "了解更多",
    accept: "接受",
    decline: "拒絕",
    close: "關閉",
    privacyAndTerms: "隱私政策和服務條款"
  }
});

// 高性能 localStorage 缓存工具
const localStorageCache = (() => {
  const cache = new Map<string, { value: string | null; timestamp: number }>();
  const TTL = 1500; // 1.5秒缓存，平衡性能和实时性
  
  return {
    get(key: string): string | null {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < TTL) {
        return cached.value;
      }

      try {
        const value = localStorage.getItem(key);
        cache.set(key, { value, timestamp: Date.now() });
        return value;
      } catch (error) {
        console.warn('Error accessing localStorage:', error);
        return null;
      }
    },

    set(key: string, value: string): void {
      try {
        localStorage.setItem(key, value);
        cache.set(key, { value, timestamp: Date.now() });
      } catch (error) {
        console.warn('Error setting localStorage:', error);
      }
    },

    // 清理过期缓存
    cleanup(): void {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      cache.forEach((cached, key) => {
        if (now - cached.timestamp >= TTL) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => cache.delete(key));
    }
  };
})();

// 智能防抖函数 - 支持立即执行和尾随执行
function smartThrottle<T extends (...args: unknown[]) => void>(
  func: T, 
  wait: number, 
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  let timeout: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  const { leading = false, trailing = true } = options;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (!lastCallTime && leading === false) {
      lastCallTime = now;
    }
    
    const remaining = wait - (now - lastCallTime);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCallTime = now;
      func(...args);
    } else if (!timeout && trailing !== false) {
      timeout = setTimeout(() => {
        lastCallTime = leading === false ? 0 : Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  }) as T;
}

// 优化的语言检测 - 减少计算和内存分配
let cachedLocale: { locale: string; pathname: string; timestamp: number } | null = null;
const LOCALE_CACHE_TTL = 3000; // 3秒缓存

function detectCurrentLocale(): string {
  if (typeof window === 'undefined') return 'en';
  
  try {
    const pathname = window.location.pathname;
    const now = Date.now();
    
    // 检查缓存是否有效
    if (cachedLocale && 
        cachedLocale.pathname === pathname && 
        (now - cachedLocale.timestamp) < LOCALE_CACHE_TTL) {
      return cachedLocale.locale;
    }
    
    // 优化：直接检查路径开头，避免 split 操作
    const firstSlash = pathname.indexOf('/', 1);
    const potentialLocale = firstSlash === -1 
      ? pathname.slice(1) 
      : pathname.slice(1, firstSlash);
    
    const locale = messages[potentialLocale] ? potentialLocale : 'en';
    
    // 缓存结果
    cachedLocale = { locale, pathname, timestamp: now };
    return locale;
  } catch (error) {
    console.warn('Error detecting locale:', error);
    return 'en';
  }
}

// 使用 memo 优化组件渲染
const CookieConsent = memo(function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [locale, setLocale] = useState('en');
  const [isClientSide, setIsClientSide] = useState(false);
  const currentPathRef = useRef<string>('');
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 优化的路由检查函数 - 使用节流避免过度执行
  const checkForRouteChange = smartThrottle(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== currentPathRef.current) {
      currentPathRef.current = currentPath;
      const newLocale = detectCurrentLocale();
      if (newLocale !== locale) {
        setLocale(newLocale);
      }
    }
  }, 150, { leading: true, trailing: true });

  useEffect(() => {
    setIsClientSide(true);
    
    const currentLocale = detectCurrentLocale();
    setLocale(currentLocale);
    currentPathRef.current = window.location.pathname;

    const consent = localStorageCache.get('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }

    // 设置定期缓存清理
    cleanupTimerRef.current = setInterval(() => {
      localStorageCache.cleanup();
    }, 60000); // 每分钟清理一次

    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isClientSide) return;

    // 只监听必要的事件，移除性能杀手 MutationObserver
    const handlePopState = () => checkForRouteChange();
    
    // 监听浏览器前进/后退
    window.addEventListener('popstate', handlePopState, { passive: true });
    
    // 劫持程序化导航 - 使用更高效的方式
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      // 使用 requestAnimationFrame 优化时机
      requestAnimationFrame(() => checkForRouteChange());
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      requestAnimationFrame(() => checkForRouteChange());
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [isClientSide, checkForRouteChange]);

  // 优化事件处理函数 - 减少闭包创建
  const handleAccept = () => {
    localStorageCache.set('cookie-consent', 'accepted');
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    localStorageCache.set('cookie-consent', 'declined');
    setIsVisible(false);
    
    // 异步处理 GA 配置，避免阻塞 UI
    if (typeof window !== 'undefined' && window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      setTimeout(() => {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
          send_page_view: false,
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        });
      }, 0);
    }
    
    onDecline?.();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // 早期返回优化
  if (!isClientSide || !isVisible) {
    return null;
  }

  // 缓存翻译和链接，避免每次渲染时重新计算
  const t = messages[locale] || messages.en;
  const privacyHref = locale === 'en' ? '/privacy-and-terms' : `/${locale}/privacy-and-terms`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-900 mb-1">
              {t.title}
            </h2>
            <p className="text-sm text-gray-600">
              {t.description}
              <a 
                href={privacyHref}
                title={t.privacyAndTerms}
                className="text-red-400 hover:text-red-600 underline ml-1"
              >
                {t.learnMore}
              </a>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {t.decline}
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
            >
              {t.accept}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={t.close}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CookieConsent;

// 优化的工具函数 - 使用缓存版本
export const hasUserConsentedToCookies = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  const consent = localStorageCache.get('cookie-consent');
  return consent !== 'declined';
};

export const hasUserDeclinedCookies = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return localStorageCache.get('cookie-consent') === 'declined';
};

export const getCookieConsentStatus = (): 'accepted' | 'declined' | null => {
  if (typeof window === 'undefined') return null;
  
  const consent = localStorageCache.get('cookie-consent');
  return consent as 'accepted' | 'declined' | null;
}; 