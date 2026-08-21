import { Link, useLocation, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { Menu, Search } from 'lucide-react';
import { useOrg, useProject, usePermissions } from '@/hooks/useScope';
import { useUiStore } from '@/store/uiStore';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';

const TITLES: Record<string, string> = {
  'my-work': 'My work',
  projects: 'Projects',
  members: 'Members & invitations',
  workload: 'Workload',
  board: 'Board',
  backlog: 'Backlog',
  sprints: 'Sprints',
  store: 'Store',
  settings: 'Settings',
};

export function Topbar() {
  const org = useOrg();
  const project = useProject();
  const { canEdit, isManager } = usePermissions();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const openModal = useUiStore((s) => s.openModal);
  const toggleMobileNav = useUiStore((s) => s.toggleMobileNav);

  if (!org) return null;
  const view = location.pathname.split('/').filter(Boolean).pop() ?? '';
  const title = project ? (TITLES[view] ?? view) : (TITLES[view] ?? 'My work');
  const showSearch = view === 'backlog';
  const showNewTask = canEdit && !!project && (view === 'board' || view === 'backlog');
  const showViewerChip = !!project && !canEdit && ['board', 'backlog', 'settings'].includes(view);
  const crumb = `${org.slug} / ${project && ['board', 'backlog', 'sprints', 'settings', 'workload', 'store'].includes(view) ? project.key : 'organization'}`;

  const tabDefs = project
    ? [
        { id: 'board', label: 'Board' },
        { id: 'backlog', label: 'Backlog' },
        { id: 'sprints', label: 'Sprints' },
        { id: 'store', label: 'Store' },
        ...(isManager ? [{ id: 'workload', label: 'Workload' }] : []),
        { id: 'settings', label: 'Settings' },
      ]
    : [];

  return (
    <>
      <div className="px-4 sm:px-6 pt-4 pb-3 flex flex-wrap items-end gap-3">
        <button
          onClick={toggleMobileNav}
          className="md:hidden flex-none w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-ink hover:bg-ink/7 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex-1 min-w-[140px]">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-200 text-accent-700 text-[11.5px] font-semibold flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />scoped to {org.slug}
            </span>
            <span className="hidden sm:inline text-xs text-neutral-600 truncate">{crumb}</span>
          </div>
          <h2 className="font-heading text-[26px] sm:text-[32px] leading-tight">{title}</h2>
        </div>
        {showViewerChip && <Pill tone="accent2">Viewer · read only</Pill>}
        {showSearch && (
          <div className="relative w-full sm:w-auto order-last sm:order-none">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              value={params.get('q') ?? ''}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                if (e.target.value) next.set('q', e.target.value); else next.delete('q');
                setParams(next, { replace: true });
              }}
              placeholder="Search issues"
              className="w-full sm:w-[230px] h-10 border border-line rounded-full bg-neutral-100 pl-9 pr-4 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        )}
        {showNewTask && <Button variant="primary" onClick={() => openModal('createIssueOpen')}>New Task</Button>}
      </div>

      {tabDefs.length > 0 && (
        <div className="px-4 sm:px-6 pb-3 flex gap-1.5 overflow-x-auto">
          {tabDefs.map((t) => (
            <Link
              key={t.id}
              to={`/o/${org.slug}/p/${project!.key}/${t.id}`}
              className={clsx(
                'px-4 py-1.5 rounded-full font-heading text-sm no-underline whitespace-nowrap flex-none',
                view === t.id ? 'bg-accent-200 text-accent-700' : 'text-neutral-600 hover:bg-ink/5',
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
