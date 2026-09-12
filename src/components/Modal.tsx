'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const t = useTranslations();
  return (
    <header className="flex items-center justify-between gap-3">
      <DialogTitle as="h2" className="text-xl font-semibold text-foreground [overflow-wrap:anywhere] sm:text-2xl">
        {title}
      </DialogTitle>
      <button type="button" className="btn-icon" onClick={onClose} aria-label={t('common.close')} title={t('common.close')}>
        <XMarkIcon aria-hidden="true" />
      </button>
    </header>
  );
}

export default function Modal({
  isOpen,
  onClose,
  children,
  className = 'max-w-2xl',
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-overlay backdrop-blur-xs duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 overflow-y-auto safe-all">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className={`w-full rounded-2xl bg-surface shadow-xl duration-200 data-closed:scale-95 data-closed:opacity-0 ${className}`}
          >
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
