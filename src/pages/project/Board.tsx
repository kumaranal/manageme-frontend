import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useOrg, useProject, usePermissions, useMe } from '@/hooks/useScope';
import { useDataStore } from '@/store/dataStore';
import { FilterDropdown } from '@/components/FilterDropdown';
import { Avatar, UnassignedAvatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDue, isOverdue } from '@/lib/format';
import { PRIORITY_CODE } from '@/data/people';
import { usePeopleStore } from '@/store/peopleStore';
import type { Issue } from '@/types';

interface DragState { issueId: string; overStatus: string; overIndex: number }

export default function Board() {
  const org = useOrg();
  const project = useProject();
  const me = useMe();
  const { isManager, canEdit } = usePermissions();
  const moveIssue = useDataStore((s) => s.moveIssue);
  const people = usePeopleStore((s) => s.people);
  const navigate = useNavigate();
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [sprintIds, setSprintIds] = useState<string[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);

  // Reset filters when the selected project changes, following React's
  // "adjusting state during render" pattern instead of an effect.
  const [filtersForProject, setFiltersForProject] = useState(project?.id);
  if (project?.id !== filtersForProject) {
    setFiltersForProject(project?.id);
    setAssigneeIds([]);
    setSprintIds([]);
    setDrag(null);
  }

  const assigneeOptions = useMemo(() => {
    if (!project) return [];
    const opts = [{ id: 'unassigned', label: 'Unassigned' }, { id: me, label: 'Me' }];
    project.members.filter((m) => m.userId !== me).forEach((m) => opts.push({ id: m.userId, label: (people[m.userId]?.name ?? '').split(' ')[0] }));
    return opts;
  }, [project, me, people]);
  const sprintOptions = useMemo(() => [{ id: 'none', label: 'No sprint' }, ...(project?.sprints.map((s) => ({ id: s.id, label: s.name })) ?? [])], [project]);

  if (!org || !project) return null;

  const pool = project.issues.filter((i) => {
    if (assigneeIds.length && !assigneeIds.includes(i.assignee ?? 'unassigned')) return false;
    if (sprintIds.length && !sprintIds.includes(i.sprintId ?? 'none')) return false;
    return true;
  });

  const openIssue = (issue: Issue) => navigate(`?issue=${issue.id}`, { replace: false });

  const columns = project.statuses.map((st) => {
    const list = pool.filter((i) => i.statusId === st.id).sort((a, b) => a.rank - b.rank);
    return { status: st, issues: list };
  });

  const handleDrop = (statusId: string) => {
    if (!drag) return;
    const col = pool.filter((i) => i.statusId === statusId && i.id !== drag.issueId).sort((a, b) => a.rank - b.rank);
    const idx = Math.min(drag.overStatus === statusId ? drag.overIndex : col.length, col.length);
    moveIssue(org.id, project.id, drag.issueId, statusId, idx);
    setDrag(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap gap-2 items-center mb-3">
        <FilterDropdown label="Assignee" options={assigneeOptions} selectedIds={assigneeIds} onChange={setAssigneeIds} />
        <FilterDropdown label="Sprint" options={sprintOptions} selectedIds={sprintIds} onChange={setSprintIds} />
      </div>
      <div className="flex gap-3 items-start flex-1 min-h-0 pb-2 overflow-x-auto">
        {columns.map(({ status, issues }) => {
          const isOver = drag?.overStatus === status.id;
          return (
            <div
              key={status.id}
              onDragOver={(e) => {
                if (!drag) return;
                e.preventDefault();
                if (drag.overStatus !== status.id) setDrag({ ...drag, overStatus: status.id, overIndex: issues.length });
              }}
              onDrop={(e) => { e.preventDefault(); handleDrop(status.id); }}
              className={clsx('flex-none w-[82vw] sm:w-[300px] max-w-[300px] rounded-3xl p-3 flex flex-col max-h-full border-2', isOver ? 'border-accent' : 'border-transparent', 'bg-surface')}
            >
              <div className="flex items-center gap-2 px-2 pb-3 pt-1">
                <div className="font-heading text-base flex-1 min-w-0 truncate">{status.name}</div>
                <div className="text-xs text-neutral-600">{issues.length}</div>
                <div className="px-2 py-0.5 rounded-full bg-canvas text-neutral-600 text-[10.5px] font-semibold tracking-wider uppercase">
                  {status.category.replace('_', ' ')}
                </div>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto px-0.5 pb-0.5 min-h-[60px]">
                {issues.map((issue, idx) => {
                  const canMoveThis = isManager || issue.assignee === me;
                  const isHot = issue.priority === 'Urgent' || issue.priority === 'High';
                  const showIndicator = drag?.overStatus === status.id && drag.overIndex === idx && drag.issueId !== issue.id;
                  const overdue = isOverdue(issue.due, status.category === 'DONE');
                  return (
                    <div key={issue.id}>
                      {showIndicator && <div className="h-[3px] rounded-full bg-accent mb-2" />}
                      <div
                        draggable={canMoveThis}
                        onDragStart={(e) => { if (!canMoveThis) { e.preventDefault(); return; } e.dataTransfer.effectAllowed = 'move'; setDrag({ issueId: issue.id, overStatus: status.id, overIndex: idx }); }}
                        onDragEnd={() => setDrag(null)}
                        onDragOver={(e) => {
                          if (!drag) return;
                          e.preventDefault(); e.stopPropagation();
                          const r = e.currentTarget.getBoundingClientRect();
                          const target = e.clientY > r.top + r.height / 2 ? idx + 1 : idx;
                          if (drag.overStatus !== status.id || drag.overIndex !== target) setDrag({ ...drag, overStatus: status.id, overIndex: target });
                        }}
                        onClick={() => openIssue(issue)}
                        className={clsx(
                          'bg-neutral-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow',
                          canMoveThis ? 'cursor-grab' : 'cursor-pointer',
                          !isManager && canMoveThis && 'ring-2 ring-accent',
                          drag?.issueId === issue.id && 'opacity-40',
                        )}
                      >
                        <div className="text-[14.5px] leading-snug text-balance mb-3.5">{issue.title}</div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <div className="text-xs font-semibold text-neutral-600 tracking-wide">{project.key}-{issue.number}</div>
                          <Pill tone={isHot ? 'accent' : 'neutral'} size="sm" title={PRIORITY_CODE[issue.priority]}>{issue.priority}</Pill>
                          {issue.due && <div className={clsx('text-[11.5px]', overdue ? 'text-accent-700 font-semibold' : 'text-neutral-600')}>{formatDue(issue.due)}</div>}
                          {issue.labels.map((l) => (
                            <Pill key={l} tone="accent2" size="sm" title={l} className="max-w-[110px] truncate">{l}</Pill>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          {issue.assignee ? <Avatar userId={issue.assignee} size="sm" /> : <UnassignedAvatar size="sm" />}
                          {issue.cc.length > 0 && (
                            <div className="flex">
                              {issue.cc.slice(0, 3).map((uid) => (
                                <Avatar key={uid} userId={uid} size="xs" tone="accent2" className="border-2 border-neutral-100 -ml-2 first:ml-0" />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isOver && drag && drag.overIndex >= issues.length && <div className="h-[3px] rounded-full bg-accent" />}
                {issues.length === 0 && <EmptyState dashed>Nothing here</EmptyState>}
              </div>
            </div>
          );
        })}
      </div>
      {!canEdit && (
        <div className="pt-3 text-[11.5px] text-neutral-600">You can drag your own assigned cards; everything else here is read only.</div>
      )}
    </div>
  );
}
