import { usePeopleStore } from '@/store/peopleStore';
import { cn } from '@/lib/cn';

const sizeClasses: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
  xs: 'w-[20px] h-[20px] text-[9.5px]',
  sm: 'w-[26px] h-[26px] text-[10.5px]',
  md: 'w-[32px] h-[32px] text-[11.5px]',
  lg: 'w-[46px] h-[46px] text-[19px]',
};

export function Avatar({
  userId, size = 'md', tone = 'neutral', className,
}: { userId: string; size?: 'xs' | 'sm' | 'md' | 'lg'; tone?: 'neutral' | 'accent' | 'accent2'; className?: string }) {
  const person = usePeopleStore((s) => s.people[userId]);
  const toneClasses = tone === 'accent'
    ? 'bg-accent text-canvas'
    : tone === 'accent2'
      ? 'bg-accent2-200 text-accent2-700'
      : 'bg-neutral-300 text-neutral-800';
  return (
    <div
      title={person?.name}
      className={cn('flex-none rounded-full flex items-center justify-center font-bold', sizeClasses[size], toneClasses, className)}
    >
      {person?.initials ?? '?'}
    </div>
  );
}

export function UnassignedAvatar({ size = 'md' }: { size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return <div className={cn('flex-none rounded-full border border-dashed border-neutral-400', sizeClasses[size])} />;
}

export function OrgAvatar({
  initial, size = 'md', tone = 'accent',
}: { initial: string; size?: 'xs' | 'sm' | 'md' | 'lg'; tone?: 'accent' | 'solid' }) {
  const toneClasses = tone === 'solid' ? 'bg-accent text-canvas' : 'bg-accent-200 text-accent-700';
  return (
    <div className={cn('flex-none rounded-full flex items-center justify-center font-heading', sizeClasses[size], toneClasses)}>
      {initial}
    </div>
  );
}
