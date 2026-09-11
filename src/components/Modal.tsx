'use client';

import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import type { ReactNode } from 'react';

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
        className="fixed inset-0 bg-black/25 backdrop-blur-xs duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 overflow-y-auto safe-all">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className={`w-full rounded-2xl bg-white shadow-xl duration-200 data-closed:scale-95 data-closed:opacity-0 ${className}`}
          >
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
