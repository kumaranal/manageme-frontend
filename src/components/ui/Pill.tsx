import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'accent' | 'accent2' | 'neutral' | 'outline';

const toneClasses: Record<Tone, string> = {
  accent: 'bg-accent-200 text-accent-700',
  accent2: 'bg-accent2-200 text-accent2-700',
  neutral: 'bg-neutral-200 text-neutral-700',
  outline: 'border border-line text-neutral-800',
};

export function Pill({
  children, tone = 'neutral', className, size = 'md', ...rest
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode; tone?: Tone; className?: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold whitespace-nowrap',
        size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1',
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
