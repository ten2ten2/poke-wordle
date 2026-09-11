import { ReactNode } from 'react';

import Pokeball from '@/components/Pokeball';

export function FAQ({ children }: { children: ReactNode }) {
  return (
    <section itemScope itemType="https://schema.org/FAQPage">
      {children}
    </section>
  );
}

export function Question({ children }: { children: ReactNode }) {
  return (
    <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
      <h2 itemProp="name" className="flex items-center gap-2">
        <Pokeball className="size-6 shrink-0" />
        {children}
      </h2>
    </div>
  );
}

export function Answer({ children }: { children: ReactNode }) {
  return (
    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
      <div itemProp="text">{children}</div>
    </div>
  );
} 