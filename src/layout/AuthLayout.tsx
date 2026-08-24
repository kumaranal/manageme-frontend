import type { ReactNode } from 'react';

export function AuthLayout({
  children, width = 412, topRight,
}: { children: ReactNode; width?: number; topRight?: ReactNode }) {
  return (
    <div className="h-screen w-full flex items-center justify-center relative overflow-hidden bg-canvas">
      <div className="absolute w-[520px] h-[520px] rounded-full bg-accent-200 opacity-55 -left-40 -top-36" />
      <div className="absolute w-[360px] h-[360px] rounded-full bg-accent2-200 opacity-60 -right-24 -bottom-28" />
      {topRight && <div className="absolute top-6 right-6 z-10">{topRight}</div>}
      <div style={{ width }} className="relative max-w-[92vw] bg-neutral-100 rounded-3xl p-8 shadow-lg">
        {children}
      </div>
    </div>
  );
}
