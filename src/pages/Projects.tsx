import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrg, usePermissions, useMe } from '@/hooks/useScope';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useUiStore } from '@/store/uiStore';
import { PEOPLE } from '@/data/people';
import { projectRole } from '@/lib/permissions';

export default function Projects() {
  const org = useOrg();
  const me = useMe();
  const { isOrgAdmin } = usePermissions();
  const openModal = useUiStore((s) => s.openModal);
  const [showArchived, setShowArchived] = useState(false);
  if (!org) return null;

  const archivedCount = org.projects.filter((p) => p.archived).length;
  const visible = org.projects.filter((p) => (showArchived ? true : !p.archived));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button onClick={() => setShowArchived((v) => !v)} className="flex-1 text-left text-[13px] text-neutral-600 cursor-pointer select-none">
          {showArchived ? 'Hide archived projects' : `Show archived projects (${archivedCount})`}
        </button>
        {isOrgAdmin && <Button variant="primary" size="sm" onClick={() => openModal('newProjectOpen')}>New project</Button>}
      </div>

      {visible.length === 0 ? (
        <EmptyState className="bg-neutral-100 shadow-sm">No archived projects.</EmptyState>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => {
            const openCount = p.issues.filter((i) => (p.statuses.find((s) => s.id === i.statusId)?.category) !== 'DONE').length;
            const role = projectRole(p, me, org);
            return (
              <Link
                key={p.id}
                to={`/o/${org.slug}/p/${p.key}/board`}
                className={`bg-neutral-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow no-underline text-ink ${p.archived ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Pill tone="accent2">{p.key}</Pill>
                  {p.archived && <Pill>Archived</Pill>}
                </div>
                <div className="font-heading text-2xl leading-tight mb-2">{p.name}</div>
                <div className="text-sm text-neutral-800 leading-relaxed mb-4 text-balance">{p.blurb}</div>
                <div className="flex gap-4 text-xs text-neutral-600">
                  <div>{openCount} open</div>
                  <div>you: {role?.toLowerCase() ?? 'no access'}</div>
                  <div>lead: {PEOPLE[p.lead]?.name.split(' ')[0]}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
