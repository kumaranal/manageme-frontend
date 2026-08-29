const WORD = 'manage-me';
const LETTER_COLORS = ['var(--color-accent)', 'var(--color-accent2)', 'var(--color-ink)'];

/**
 * Full-viewport loader shown while a page's data hasn't loaded yet. Dances
 * the wordmark instead of a generic spinner — brand personality over boredom
 * for what's usually only a beat or two of waiting.
 */
export function PageLoader() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-3 bg-canvas">
      <div className="font-heading text-[34px] sm:text-[42px] leading-none flex" aria-hidden="true">
        {WORD.split('').map((ch, i) => (
          <span
            key={i}
            className="inline-block animate-[page-loader-bounce_1.2s_ease-in-out_infinite]"
            style={{
              animationDelay: `${i * 0.07}s`,
              color: LETTER_COLORS[i % LETTER_COLORS.length],
            }}
          >
            {ch === '-' ? '‑' : ch}
          </span>
        ))}
      </div>
      <div className="text-[13px] text-neutral-600">Getting things ready…</div>
      <span className="sr-only">Loading…</span>
      <style>{`
        @keyframes page-loader-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
