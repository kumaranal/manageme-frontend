import type { Issue, Project, WorkloadPeriod } from '@/types';
import { PEOPLE } from '@/data/people';

function periodWindow(period: WorkloadPeriod): { start: Date; end: Date } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'day') return { start: d, end: d };
  if (period === 'month') {
    return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) };
  }
  const dow = (d.getDay() + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - dow);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

export interface WorkloadRow {
  userId: string;
  name: string;
  initials: string;
  occupied: number;
  capacity: number;
  weeklyCapacity: number;
  pct: number;
  overLabel: string;
  unscheduledHours: number;
}

export function computeWorkload(userIds: string[], issues: Issue[], capacityOf: (uid: string) => number, period: WorkloadPeriod): WorkloadRow[] {
  const { start, end } = periodWindow(period);
  const factor = period === 'day' ? 1 / 5 : period === 'month' ? 4 : 1;
  return userIds.map((uid) => {
    let occupied = 0;
    let unscheduled = 0;
    issues.forEach((i) => {
      if (i.assignee !== uid || !i.estimatedHours) return;
      if (!i.due) {
        unscheduled += i.estimatedHours;
        return;
      }
      const due = new Date(i.due + 'T00:00:00');
      if (due >= start && due <= end) occupied += i.estimatedHours;
    });
    const weeklyCapacity = capacityOf(uid);
    const capacity = weeklyCapacity * factor;
    const pct = capacity ? Math.round((occupied / capacity) * 100) : 0;
    return {
      userId: uid,
      name: PEOPLE[uid].name,
      initials: PEOPLE[uid].initials,
      occupied,
      capacity: Math.round(capacity * 10) / 10,
      weeklyCapacity,
      pct,
      overLabel: pct > 100 ? 'over by ' + Math.round((occupied - capacity) * 10) / 10 + 'h' : '',
      unscheduledHours: unscheduled,
    };
  });
}

export function openIssuesForWorkload(project: Project): Issue[] {
  const doneStatusIds = new Set(project.statuses.filter((s) => s.category === 'DONE').map((s) => s.id));
  return project.issues.filter((i) => !doneStatusIds.has(i.statusId));
}

export function barColor(pct: number): string {
  if (pct > 100) return 'var(--color-accent-700)';
  if (pct >= 85) return 'var(--color-accent-500)';
  return 'var(--color-accent2-500)';
}
