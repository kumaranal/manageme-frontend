import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-canvas hover:bg-accent-600 active:bg-accent-700',
  secondary: 'border border-line hover:bg-ink/7 active:bg-ink/[0.14]',
  ghost: 'text-accent-700 hover:bg-accent/10 active:bg-accent/[0.18]',
  danger: 'border border-accent/30 text-accent-700 hover:bg-accent/10',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13.5px]',
  md: 'h-10 px-5 text-sm',
};

export function Button({
  variant = 'secondary', size = 'md', className, children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-heading cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
