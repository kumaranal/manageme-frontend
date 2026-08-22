import { Button } from './Button';

export function Pagination({
  page, pageSize, total, onChange,
}: { page: number; pageSize: number; total: number; onChange: (page: number) => void }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-3 px-1">
      <div className="text-[12.5px] text-neutral-600">
        Page {page} of {pageCount} · {total} total
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</Button>
        <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
