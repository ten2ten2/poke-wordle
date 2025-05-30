'use client';

import { useEffect, useState } from 'react';
import { hasUserDeclinedCookies } from './CookieConsent';

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

  useEffect(() => {
    // Ensure we're on the client side to prevent hydration mismatch
    setIsClientSide(true);
  }, []);

  useEffect(() => {
    // Only initialize AdSense on client side after hydration
    if (!isClientSide) return;

    // 默认初始化 Google AdSense，只有用户明确拒绝时才不初始化
    // if (!hasUserDeclinedCookies()) {
      // Initialize adsbygoogle array if it doesn't exist
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];
      }
    // }
  }, [publisherId, isClientSide]);

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

  useEffect(() => {
    // Ensure we're on the client side to prevent hydration mismatch
    setIsClientSide(true);
  }, []);

  useEffect(() => {
    // Only push ads on client side after hydration
    if (!isClientSide) return;

    // 只有在用户没有明确拒绝的情况下才显示广告
    // if (!hasUserDeclinedCookies() && typeof window !== 'undefined') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    // }
  }, [isClientSide]);

  // 如果用户拒绝了 Cookie，不渲染广告
  // if (hasUserDeclinedCookies()) {
  //   return null;
  // }

  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  
  if (!publisherId) {
    console.warn('AdSense Publisher ID not found. Please set NEXT_PUBLIC_ADSENSE_PUBLISHER_ID environment variable.');
    return null;
  }

  // Don't render anything on server side to prevent hydration mismatch
  if (!isClientSide) {
    return <div className={`adsbygoogle ${className}`} style={{ display: 'block', ...style }} />;
  }

  return (
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