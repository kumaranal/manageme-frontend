import { useNavigate } from 'react-router-dom';
import { useOrg, useProject, usePermissions } from '@/hooks/useScope';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { useUiStore } from '@/store/uiStore';
import { useDataStore } from '@/store/dataStore';

export default function Sprints() {
  const org = useOrg();
  const project = useProject();
  const { canEdit } = usePermissions();
  const openModal = useUiStore((s) => s.openModal);
  const startSprint = useDataStore((s) => s.startSprint);
  const completeSprint = useDataStore((s) => s.completeSprint);
  const navigate = useNavigate();
  if (!org || !project) return null;

  return (
    <div className="flex flex-col gap-3 max-w-[760px]">
      {canEdit && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={() => openModal('sprintCreateOpen')}>New sprint</Button>
        </div>
      )}
      {project.sprints.map((s) => {
        const issues = project.issues.filter((i) => i.sprintId === s.id);
        const doneCount = issues.filter((i) => project.statuses.find((st) => st.id === i.statusId)?.category === 'DONE').length;
        return (
          <div key={s.id} className="bg-neutral-100 rounded-3xl px-4 sm:px-6 py-4 shadow-sm flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate(`/o/${org.slug}/p/${project.key}/backlog`)}
              className="flex-1 min-w-0 text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="font-heading text-xl">{s.name}</div>
                <Pill tone={s.status === 'ACTIVE' ? 'accent' : s.status === 'CLOSED' ? 'neutral' : 'accent2'} size="sm">
                  {s.status === 'ACTIVE' ? 'Active' : s.status === 'CLOSED' ? 'Closed' : 'Planned'}
                </Pill>
              </div>
              <div className="text-[12.5px] text-neutral-600">
                {s.startDate} → {s.endDate} · {issues.length} issue{issues.length === 1 ? '' : 's'}{issues.length ? ` · ${doneCount} done` : ''}
              </div>
            </button>
            {canEdit && s.status === 'PLANNED' && (
              <Button variant="secondary" size="sm" onClick={() => startSprint(org.id, project.id, s.id)}>Start</Button>
            )}
            {canEdit && s.status === 'ACTIVE' && (
              <Button variant="secondary" size="sm" onClick={() => completeSprint(org.id, project.id, s.id)}>Complete</Button>
            )}
          </div>
        );
      })}
      {project.sprints.length === 0 && (
        <EmptyState className="bg-neutral-100 shadow-sm">No sprints yet. Issues created here stay in the backlog until one exists.</EmptyState>
      )}
    </div>
  );
}
