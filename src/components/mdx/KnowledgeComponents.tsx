import type { ReactNode } from 'react';

import Pokeball from '@/components/Pokeball';

export function FAQ({ children }: { children: ReactNode }) {
  return <section>{children}</section>;
}

export function Question({ children }: { children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2">
      <Pokeball className="size-6 shrink-0" />
      {children}
    </h2>
  );
}

export function Answer({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
