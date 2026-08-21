import { Link } from 'react-router-dom';
import { useOrg, useMe } from '@/hooks/useScope';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDue } from '@/lib/format';

export default function MyWork() {
  const org = useOrg();
  const me = useMe();
  if (!org) return null;

  const groups = org.projects.map((p) => {
    const rows = p.issues.filter((i) => i.assignee === me).sort((a, b) => a.number - b.number);
    return { project: p, rows };
  }).filter((g) => g.rows.length > 0);

  if (groups.length === 0) {
    return <EmptyState className="bg-neutral-100 shadow-sm max-w-[940px]">Nothing assigned to you in this organization.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-4 max-w-[940px]">
      {groups.map(({ project, rows }) => (
        <div key={project.id} className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5 px-4 sm:px-6 pt-4 pb-3">
            <Pill tone="accent2">{project.key}</Pill>
            <div className="font-heading text-xl">{project.name}</div>
            <div className="text-[12.5px] text-neutral-600">{rows.length} assigned</div>
          </div>
          {rows.map((r) => {
            const status = project.statuses.find((s) => s.id === r.statusId);
            return (
              <Link
                key={r.id}
                to={`/o/${org.slug}/p/${project.key}/board?issue=${r.id}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 sm:px-6 py-3 border-t border-line text-sm no-underline text-ink hover:bg-neutral-200"
              >
                <div className="w-[70px] flex-none text-[12.5px] font-semibold text-neutral-700">{project.key}-{r.number}</div>
                <div className="flex-1 min-w-[100px] truncate">{r.title}</div>
                <Pill>{status?.name}</Pill>
                <div className="w-20 text-right text-[12.5px] text-neutral-600">{formatDue(r.due)}</div>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
