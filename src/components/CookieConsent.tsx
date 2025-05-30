'use client';

import React, { useState, useEffect } from 'react';
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

// 所有语言的翻译消息
const messages: Record<string, CookieConsentMessages> = {
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
};

// 从 URL 路径检测当前语言 - 仅客户端安全版本
function detectCurrentLocale(): string {
  if (typeof window === 'undefined') return 'en';
  
  try {
    const pathname = window.location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    
    // 如果第一个段是已知的语言代码，则使用它
    if (segments.length > 0 && messages[segments[0]]) {
      return segments[0];
    }
  } catch (error) {
    // Fallback in case of any errors
    console.warn('Error detecting locale:', error);
  }
  
  // 否则默认为英语
  return 'en';
}

export default function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  // Initialize with false to prevent hydration mismatch
  const [isVisible, setIsVisible] = useState(false);
  const [locale, setLocale] = useState('en');
  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side to prevent hydration mismatch
    setIsClientSide(true);
    
    // 检测当前语言
    const currentLocale = detectCurrentLocale();
    setLocale(currentLocale);

    // 检查用户是否已经做出选择 - 只在客户端执行
    try {
      const consent = localStorage.getItem('cookie-consent');
      if (!consent) {
        setIsVisible(true);
      }
    } catch (error) {
      // In case localStorage is not available, default to showing consent
      console.warn('localStorage not available:', error);
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    // Only set up route change detection after client-side hydration
    if (!isClientSide) return;

    // 简单的路由变化检测 - 使用定时器定期检查 URL 变化
    const checkForRouteChange = () => {
      const newLocale = detectCurrentLocale();
      if (newLocale !== locale) {
        setLocale(newLocale);
      }
    };

    // 监听 popstate 事件（浏览器前进/后退）
    window.addEventListener('popstate', checkForRouteChange);
    
    // 使用定时器定期检查路由变化（用于程序化导航）
    const intervalId = setInterval(checkForRouteChange, 1000);

    return () => {
      window.removeEventListener('popstate', checkForRouteChange);
      clearInterval(intervalId);
    };
  }, [locale, isClientSide]);

  const handleAccept = () => {
    try {
      localStorage.setItem('cookie-consent', 'accepted');
      setIsVisible(false);
      onAccept?.();
    } catch (error) {
      console.warn('Error saving cookie consent:', error);
      setIsVisible(false);
      onAccept?.();
    }
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('cookie-consent', 'declined');
      setIsVisible(false);
      
      // 通知 Google Analytics 关闭追踪
      if (typeof window !== 'undefined' && window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
          send_page_view: false,
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        });
      }
      
      onDecline?.();
    } catch (error) {
      console.warn('Error saving cookie consent:', error);
      setIsVisible(false);
      onDecline?.();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // 获取当前语言的翻译消息
  const t = messages[locale] || messages.en;

  // 生成隐私政策页面的正确链接
  const privacyHref = locale === 'en' ? '/privacy-and-terms' : `/${locale}/privacy-and-terms`;

  // Don't render anything until client-side hydration is complete and component should be visible
  if (!isClientSide || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {t.title}
            </h3>
            <p className="text-sm text-gray-600">
              {t.description}
              <a 
                href={privacyHref}
                title={t.privacyAndTerms}
                className="text-blue-600 hover:text-blue-800 underline ml-1"
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
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
}

// 检查用户是否已同意 Cookie - 添加错误处理以防止hydration问题
export const hasUserConsentedToCookies = (): boolean => {
  if (typeof window === 'undefined') return true; // 默认同意（服务端渲染时）
  
  try {
    const consent = localStorage.getItem('cookie-consent');
    // 如果用户没有做出选择，默认为同意；只有明确拒绝时才返回 false
    return consent !== 'declined';
  } catch (error) {
    // 如果 localStorage 不可用，默认返回 true
    console.warn('Error accessing localStorage:', error);
    return true;
  }
};

// 检查用户是否明确拒绝了 Cookie - 添加错误处理
export const hasUserDeclinedCookies = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    return localStorage.getItem('cookie-consent') === 'declined';
  } catch (error) {
    // 如果 localStorage 不可用，默认返回 false
    console.warn('Error accessing localStorage:', error);
    return false;
  }
};

// 获取用户的 Cookie 同意状态 - 添加错误处理
export const getCookieConsentStatus = (): 'accepted' | 'declined' | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const consent = localStorage.getItem('cookie-consent');
    return consent as 'accepted' | 'declined' | null;
  } catch (error) {
    // 如果 localStorage 不可用，返回 null
    console.warn('Error accessing localStorage:', error);
    return null;
  }
}; 