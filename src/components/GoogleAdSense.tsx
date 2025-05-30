'use client';

import { useEffect } from 'react';
import { hasUserConsentedToCookies } from './CookieConsent';

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
  useEffect(() => {
    // Only initialize Google AdSense if user has consented to cookies
    if (hasUserConsentedToCookies()) {
      // Initialize adsbygoogle array if it doesn't exist
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];
      }
    }
  }, [publisherId]);

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
  useEffect(() => {
    // Only show ads if user has consented to cookies
    if (hasUserConsentedToCookies() && typeof window !== 'undefined') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, []);

  // Don't render ads if user hasn't consented to cookies
  if (!hasUserConsentedToCookies()) {
    return null;
  }

  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  
  if (!publisherId) {
    console.warn('AdSense Publisher ID not found. Please set NEXT_PUBLIC_ADSENSE_PUBLISHER_ID environment variable.');
    return null;
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