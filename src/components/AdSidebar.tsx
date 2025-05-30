'use client';

import { SidebarAdBanner } from './GoogleAdSense';

interface AdSidebarProps {
  className?: string;
}

export default function AdSidebar({ className = '' }: AdSidebarProps) {
  // Only render if we have a sidebar ad slot configured
  if (!process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT) {
    return null;
  }

  return (
    <aside className={`w-full max-w-xs ${className}`} aria-label="Advertisement">
      <div className="sticky top-4 space-y-4">
        <div className="text-xs text-gray-500 text-center mb-2">
          Advertisement
        </div>
        <SidebarAdBanner adSlot={process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT} />
      </div>
    </aside>
  );
} 