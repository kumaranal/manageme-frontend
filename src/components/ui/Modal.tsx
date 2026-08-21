import type { MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Modal({
  open, onClose, width = 452, children,
}: { open: boolean; onClose: () => void; width?: number; children: ReactNode }) {
  if (!open) return null;
  const stop = (e: MouseEvent) => e.stopPropagation();
  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-90 flex items-center justify-center bg-ink/28 p-4"
    >
      <div onClick={stop} style={{ width }} className="max-w-full max-h-[90vh] overflow-y-auto bg-neutral-100 rounded-3xl shadow-lg p-4 sm:p-6">
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-heading text-2xl leading-tight mb-2">{children}</h3>;
}

export function ModalActions({ children }: { children: ReactNode }) {
  return <div className="flex gap-2 justify-end mt-2">{children}</div>;
}
