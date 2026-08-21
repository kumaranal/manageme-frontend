import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Drawer({
  open, onClose, width = 500, header, children,
}: { open: boolean; onClose: () => void; width?: number; header: ReactNode; children: ReactNode }) {
  if (!open) return null;
  return createPortal(
    <>
      <div onClick={onClose} className="fixed inset-0 bg-ink/24 z-70" />
      <div
        style={{ width }}
        className="fixed top-0 right-0 bottom-0 max-w-full bg-neutral-100 sm:rounded-l-3xl shadow-lg z-80 flex flex-col"
      >
        <div className="flex flex-wrap items-center gap-3 px-4 sm:px-6 pt-4 pb-3 flex-none">
          {header}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-200 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-6">{children}</div>
      </div>
    </>,
    document.body,
  );
}
