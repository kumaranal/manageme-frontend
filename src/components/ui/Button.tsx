import { useRef, useState } from 'react';
import type { ButtonHTMLAttributes, MouseEvent } from 'react';
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

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  variant?: Variant;
  size?: Size;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
};

export function Button({
  variant = 'secondary', size = 'md', className, children, disabled, onClick, ...rest
}: ButtonProps) {
  // Most onClick handlers here fire an API call. If the handler returns a
  // promise, the button disables itself until that promise settles — so a
  // second click before the response comes back can't fire the request again.
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (!onClick || inFlight.current) return;
    const result = onClick(e);
    if (result && typeof result.then === 'function') {
      inFlight.current = true;
      setPending(true);
      result.finally(() => {
        inFlight.current = false;
        setPending(false);
      });
    }
  };

  return (
    <button
      disabled={disabled || pending}
      onClick={handleClick}
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
