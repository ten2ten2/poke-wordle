'use client';

import { useEffect, useState, useRef } from 'react';
// import { hasUserDeclinedCookies } from './CookieConsent';

// Declare global adsbygoogle
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface GoogleAdSenseProps {
  publisherId: string;
}

export default function GoogleAdSense({ publisherId }: GoogleAdSenseProps) {
  const [isClientSide, setIsClientSide] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side to prevent hydration mismatch
    setIsClientSide(true);
  }, []);

  useEffect(() => {
    // Only initialize AdSense on client side after hydration
    if (!isClientSide || isLoaded) return;

    // 延迟加载 AdSense 脚本
    const loadAdSense = async () => {
      try {
        // 检查脚本是否已经加载
        if (document.querySelector(`script[src*="adsbygoogle.js"]`)) {
          setIsLoaded(true);
          return;
        }

        // 延迟 3 秒后加载 AdSense，或在用户交互时立即加载
        const timeoutId = setTimeout(async () => {
          try {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
              // Initialize adsbygoogle array if it doesn't exist
              if (typeof window !== 'undefined') {
                window.adsbygoogle = window.adsbygoogle || [];
              }
              setIsLoaded(true);
            };

            script.onerror = () => {
              console.warn('Failed to load AdSense script');
            };

            document.head.appendChild(script);
          } catch (error) {
            console.warn('Error loading AdSense:', error);
          }
        }, 2000);

        // 监听用户交互事件，提前加载
        const loadOnInteraction = () => {
          clearTimeout(timeoutId);
          if (!document.querySelector(`script[src*="adsbygoogle.js"]`)) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
              if (typeof window !== 'undefined') {
                window.adsbygoogle = window.adsbygoogle || [];
              }
              setIsLoaded(true);
            };

            document.head.appendChild(script);
          }
          
          // 移除事件监听器
          document.removeEventListener('scroll', loadOnInteraction);
          document.removeEventListener('mousemove', loadOnInteraction);
          document.removeEventListener('touchstart', loadOnInteraction);
          document.removeEventListener('click', loadOnInteraction);
        };

        document.addEventListener('scroll', loadOnInteraction, { passive: true, once: true });
        document.addEventListener('mousemove', loadOnInteraction, { passive: true, once: true });
        document.addEventListener('touchstart', loadOnInteraction, { passive: true, once: true });
        document.addEventListener('click', loadOnInteraction, { passive: true, once: true });

        return () => {
          clearTimeout(timeoutId);
          document.removeEventListener('scroll', loadOnInteraction);
          document.removeEventListener('mousemove', loadOnInteraction);
          document.removeEventListener('touchstart', loadOnInteraction);
          document.removeEventListener('click', loadOnInteraction);
        };
      } catch (error) {
        console.warn('Error initializing AdSense:', error);
      }
    };

    loadAdSense();
  }, [publisherId, isClientSide, isLoaded]);

  return null;
}

// Component for individual ad placements
interface AdBannerProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AdBanner({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
  style = {}
}: AdBannerProps) {
  const [isClientSide, setIsClientSide] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure we're on the client side to prevent hydration mismatch
    setIsClientSide(true);
  }, []);

  useEffect(() => {
    // 使用 Intersection Observer 在广告进入视口时才加载
    if (!isClientSide || !adRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' } // 提前 100px 开始加载
    );

    observer.observe(adRef.current);

    return () => observer.disconnect();
  }, [isClientSide, isVisible]);

  useEffect(() => {
    // Only push ads when visible and on client side
    if (!isClientSide || !isVisible) return;

    // 延迟一小段时间确保 AdSense 脚本已加载
    const timeoutId = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isClientSide, isVisible]);

  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  
  if (!publisherId) {
    console.warn('AdSense Publisher ID not found. Please set NEXT_PUBLIC_ADSENSE_PUBLISHER_ID environment variable.');
    return null;
  }

  // Don't render anything on server side to prevent hydration mismatch
  if (!isClientSide) {
    return (
      <div 
        ref={adRef}
        className={`adsbygoogle ${className}`} 
        style={{ display: 'block', ...style }} 
      />
    );
  }

  return (
    <div ref={adRef}>
      {isVisible && (
        <ins
          className={`adsbygoogle ${className}`}
          style={{
            display: 'block',
            ...style
          }}
          data-ad-client={publisherId}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={fullWidthResponsive.toString()}
        />
      )}
    </div>
  );
}

// Predefined ad components for common placements
export function HeaderAdBanner({ adSlot }: { adSlot: string }) {
  return (
    <AdBanner
      adSlot={adSlot}
      adFormat="horizontal"
      className="w-full mb-4"
      style={{ minHeight: '90px' }}
    />
  );
}

export function SidebarAdBanner({ adSlot }: { adSlot: string }) {
  return (
    <AdBanner
      adSlot={adSlot}
      adFormat="vertical"
      className="w-full"
      style={{ minHeight: '250px' }}
    />
  );
}

export function InContentAdBanner({ adSlot }: { adSlot: string }) {
  return (
    <AdBanner
      adSlot={adSlot}
      adFormat="rectangle"
      className="w-full my-6 mx-auto max-w-md"
      style={{ minHeight: '250px' }}
    />
  );
}

export function FooterAdBanner({ adSlot }: { adSlot: string }) {
  return (
    <AdBanner
      adSlot={adSlot}
      adFormat="horizontal"
      className="w-full mt-4"
      style={{ minHeight: '90px' }}
    />
  );
} 