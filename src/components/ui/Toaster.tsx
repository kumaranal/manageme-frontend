import { createPortal } from 'react-dom';
import { useDataStore } from '@/store/dataStore';
import clsx from 'clsx';

export function Toaster() {
  const toasts = useDataStore((s) => s.toasts);
  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center z-120 w-full px-4 sm:w-auto sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'animate-toast-in rounded-full px-5 py-2.5 text-sm font-medium shadow-lg max-w-full text-center',
            t.tone === 'bad' ? 'bg-accent-800 text-accent-200' : 'bg-neutral-900 text-neutral-100',
          )}
        >
          {t.text}
        </div>
      ))}
    </div>,
    document.body,
  );
}
