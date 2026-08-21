import { useState } from 'react';
import { useOrg, useProject, usePermissions } from '@/hooks/useScope';
import { Avatar } from '@/components/ui/Avatar';
import { TextInput } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDataStore } from '@/store/dataStore';
import { computeWorkload, openIssuesForWorkload, barColor } from '@/lib/workload';
import type { WorkloadPeriod } from '@/types';
import clsx from 'clsx';

const PERIODS: { id: WorkloadPeriod; label: string }[] = [
  { id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' },
];

export default function ProjectWorkload() {
  const org = useOrg();
  const project = useProject();
  const { isManager } = usePermissions();
  const updateProjectMemberHours = useDataStore((s) => s.updateProjectMemberHours);
  const [period, setPeriod] = useState<WorkloadPeriod>('week');
  if (!org || !project) return null;

  const issues = openIssuesForWorkload(project);
  const capacityOf = (uid: string) => project.members.find((m) => m.userId === uid)?.weeklyHours ?? org.capacityHoursPerWeek;
  const rows = computeWorkload(project.members.map((m) => m.userId), issues, capacityOf, period);

  return (
    <div className="flex flex-col gap-4 max-w-[900px]">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-neutral-100 rounded-full p-1 shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={clsx('px-4 py-1.5 rounded-full font-heading text-sm cursor-pointer', period === p.id ? 'bg-accent-200 text-accent-700' : 'text-neutral-600')}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="text-[12.5px] text-neutral-600">Org default: {org.capacityHoursPerWeek}h / week — override per member below for anyone split across projects</div>
      </div>

      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 pt-4 pb-3">
          <div className="font-heading text-xl">Occupancy on this project</div>
          <div className="text-[12.5px] text-neutral-600 mt-0.5">Estimated hours on this project's open tasks due within the selected period, against each member's hours allocated to this project.</div>
        </div>
        {rows.map((r) => {
          const member = project.members.find((m) => m.userId === r.userId);
          return (
            <div key={r.userId}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 sm:px-6 py-3 border-t border-line">
                <Avatar userId={r.userId} size="sm" />
                <div className="flex-1 min-w-[80px] sm:w-[130px] sm:flex-none text-sm font-semibold truncate">{r.name}</div>
                <div className="w-16 flex-none text-right text-[13px] font-semibold">{r.pct}%</div>
                <div className="order-4 sm:order-none basis-full sm:basis-auto sm:flex-1 h-2.5 rounded-full bg-neutral-200 overflow-hidden">
                  <div style={{ width: `${Math.min(r.pct, 100)}%`, background: barColor(r.pct) }} className="h-full rounded-full" />
                </div>
                <div className="order-5 sm:order-none w-[110px] flex-none text-right text-[12.5px] text-neutral-600">{r.occupied}h / {r.capacity}h</div>
                {isManager && (
                  <div className="order-6 sm:order-none w-[100px] flex-none flex items-center gap-1.5">
                    <TextInput
                      type="number" min={0} step={1}
                      value={member?.weeklyHours ?? ''}
                      placeholder={String(org.capacityHoursPerWeek)}
                      onChange={(e) => updateProjectMemberHours(org.id, project.id, r.userId, e.target.value === '' ? null : Number(e.target.value))}
                      className="w-14 h-[30px] text-[12.5px] px-2"
                    />
                    <div className="text-[11px] text-neutral-600">h/wk</div>
                  </div>
                )}
              </div>
              {r.unscheduledHours > 0 && (
                <div className="pb-2 pl-4 sm:pl-[191px] pr-4 sm:pr-6 text-[11.5px] text-neutral-600">{r.unscheduledHours}h unscheduled</div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && <EmptyState>No one has access to this project yet.</EmptyState>}
        <div className="px-4 sm:px-6 py-3 border-t border-line text-[12.5px] text-neutral-600 leading-relaxed">
          Leave the hours field blank to fall back to the organization's {org.capacityHoursPerWeek}h/week default — useful for anyone dedicated fully to this project. Set it explicitly for anyone splitting time across more than one.
        </div>
      </div>
    </div>
  );
}
