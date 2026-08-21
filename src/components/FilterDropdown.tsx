import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
}

export function FilterDropdown({
  label, options, selectedIds, onChange,
}: { label: string; options: FilterOption[]; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const n = selectedIds.length;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] cursor-pointer',
          n > 0 ? 'border border-accent bg-accent-200 text-accent-700 font-semibold' : 'border border-line text-neutral-800',
        )}
      >
        {label}{n ? ` (${n})` : ''}
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="absolute top-[38px] left-0 z-40 min-w-[190px] bg-neutral-100 rounded-2xl shadow-lg p-1.5 flex flex-col gap-0.5">
          {options.map((o) => (
            <label
              key={o.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-[13px] hover:bg-neutral-200"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(o.id)}
                onChange={() => toggle(o.id)}
                className="w-[15px] h-[15px] accent-accent"
              />
              {o.label}
            </label>
          ))}
          {n > 0 && (
            <button onClick={() => onChange([])} className="text-left px-2.5 py-1.5 text-xs text-accent-700 font-semibold cursor-pointer">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
