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

export function formatMoney(minorUnits: number, currency: 'INR' | 'USD'): string {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
  }).format(minorUnits / 100);
}

export function firstName(fullName: string): string {
  return fullName.split(' ')[0];
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}
