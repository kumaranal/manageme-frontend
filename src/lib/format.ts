export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function deriveProjectKey(name: string, existingKeys: string[]): string {
  const words = name.trim().toUpperCase().split(/\s+/).filter(Boolean);
  let base = words.length > 1 ? words.map((w) => w[0]).join('').slice(0, 4) : name.trim().slice(0, 3).toUpperCase();
  if (!base) base = 'PRJ';
  let key = base;
  let n = 2;
  while (existingKeys.includes(key)) {
    key = base + n;
    n++;
  }
  return key;
}

export function formatDue(due: string | null | undefined): string {
  if (!due) return '—';
  const d = new Date(due + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return due;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function isOverdue(due: string | null | undefined, doneCategory: boolean): boolean {
  if (!due || doneCategory) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(due + 'T00:00:00');
  return d.getTime() < today.getTime();
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function firstName(fullName: string): string {
  return fullName.split(' ')[0];
}
