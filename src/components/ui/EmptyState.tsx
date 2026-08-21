import { cn } from '@/lib/cn';

export function EmptyState({ children, dashed = false, className }: { children: string; dashed?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        'py-11 px-6 text-center text-[13.5px] text-neutral-600 rounded-2xl',
        dashed ? 'border border-dashed border-neutral-400' : '',
        className,
      )}
    >
      {children}
    </div>
  );
}
