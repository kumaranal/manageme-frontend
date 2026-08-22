import { useState } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

const baseInput = 'w-full h-[42px] border border-line rounded-full bg-canvas px-4 text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-neutral-500';

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseInput, className)} {...rest} />;
}

export function PasswordInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input type={visible ? 'text' : 'password'} className={cn(baseInput, 'pr-11', className)} {...rest} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-ink transition-colors cursor-pointer"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn('w-full border border-line rounded-2xl bg-canvas px-3.5 py-3 text-sm leading-relaxed focus:outline-none focus:border-accent transition-colors resize-y', className)}
      {...rest}
    />
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(baseInput, 'pr-8 appearance-none bg-[length:14px] bg-[right_14px_center] bg-no-repeat', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2382796a'%3E%3Cpath d='M5.5 7.5l4.5 5 4.5-5' stroke='%2382796a' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")" }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600 mb-1.5">{children}</div>;
}

export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">{label}</div>
      <div>{children}</div>
    </>
  );
}
