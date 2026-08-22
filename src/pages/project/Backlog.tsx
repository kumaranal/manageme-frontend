import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrg, useProject, useMe } from '@/hooks/useScope';
import { FilterDropdown } from '@/components/FilterDropdown';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDue } from '@/lib/format';
import { usePeopleStore } from '@/store/peopleStore';

export default function Backlog() {
  const org = useOrg();
  const project = useProject();
  const me = useMe();
  const people = usePeopleStore((s) => s.people);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [statusIds, setStatusIds] = useState<string[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [sprintIds, setSprintIds] = useState<string[]>([]);

  const [filtersForProject, setFiltersForProject] = useState(project?.id);
  if (project?.id !== filtersForProject) {
    setFiltersForProject(project?.id);
    setStatusIds([]);
    setAssigneeIds([]);
    setSprintIds([]);
  }

  const statusOptions = useMemo(() => project?.statuses.map((s) => ({ id: s.id, label: s.name })) ?? [], [project]);
  const assigneeOptions = useMemo(() => {
    if (!project) return [];
    const opts = [{ id: 'unassigned', label: 'Unassigned' }, { id: me, label: 'Me' }];
    project.members.filter((m) => m.userId !== me).forEach((m) => opts.push({ id: m.userId, label: (people[m.userId]?.name ?? '').split(' ')[0] }));
    return opts;
  }, [project, me, people]);
  const sprintOptions = useMemo(() => [{ id: 'none', label: 'No sprint' }, ...(project?.sprints.map((s) => ({ id: s.id, label: s.name })) ?? [])], [project]);

  if (!org || !project) return null;
  const q = (params.get('q') ?? '').trim().toLowerCase();

  const rows = project.issues.filter((i) => {
    if (statusIds.length && !statusIds.includes(i.statusId)) return false;
    if (assigneeIds.length && !assigneeIds.includes(i.assignee ?? 'unassigned')) return false;
    if (sprintIds.length && !sprintIds.includes(i.sprintId ?? 'none')) return false;
    if (q && !i.title.toLowerCase().includes(q) && !`${project.key}-${i.number}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => a.number - b.number);

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <FilterDropdown label="Status" options={statusOptions} selectedIds={statusIds} onChange={setStatusIds} />
        <FilterDropdown label="Assignee" options={assigneeOptions} selectedIds={assigneeIds} onChange={setAssigneeIds} />
        <FilterDropdown label="Sprint" options={sprintOptions} selectedIds={sprintIds} onChange={setSprintIds} />
      </div>
      <div className="bg-neutral-100 rounded-3xl overflow-x-auto shadow-sm">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-600 min-w-[864px]">
          <div className="w-[78px] flex-none">Key</div>
          <div className="flex-1 min-w-[200px]">Summary</div>
          <div className="w-[104px] flex-none">Status</div>
          <div className="w-16 flex-none">Priority</div>
          <div className="w-[110px] flex-none">Assignee</div>
          <div className="w-[90px] flex-none">Sprint</div>
          <div className="w-[72px] flex-none">Due</div>
        </div>
        {rows.map((r) => {
          const status = project.statuses.find((s) => s.id === r.statusId);
          const sprint = r.sprintId ? project.sprints.find((s) => s.id === r.sprintId) : undefined;
          return (
            <div
              key={r.id}
              onClick={() => navigate(`?${params.toString() ? params.toString() + '&' : ''}issue=${r.id}`)}
              className="flex items-center gap-3 px-4 sm:px-6 py-3 border-t border-line cursor-pointer hover:bg-neutral-200 text-sm min-w-[864px]"
            >
              <div className="w-[78px] flex-none text-[12.5px] font-semibold text-neutral-700">{project.key}-{r.number}</div>
              <div className="flex-1 min-w-[200px] truncate">{r.title}</div>
              <div className="w-[104px] flex-none"><Pill>{status?.name}</Pill></div>
              <div className="w-16 flex-none text-xs font-semibold text-neutral-600">{r.priority}</div>
              <div className="w-[110px] flex-none text-[13px] text-neutral-800 truncate">{r.assignee ? (people[r.assignee]?.name ?? '—') : '—'}</div>
              <div className="w-[90px] flex-none text-xs text-neutral-600 truncate">{sprint ? sprint.name : 'Backlog'}</div>
              <div className="w-[72px] flex-none text-[12.5px] text-neutral-600">{formatDue(r.due)}</div>
            </div>
          );
        })}
        {rows.length === 0 && <EmptyState className="border-t border-line">Nothing matches these filters.</EmptyState>}
      </div>
    </div>
  );
}
