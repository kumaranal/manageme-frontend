import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrg, useProject, usePermissions } from '@/hooks/useScope';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useUiStore } from '@/store/uiStore';
import { STORE_KIND_LABEL, PEOPLE } from '@/data/people';
import clsx from 'clsx';

const KIND_TONE: Record<string, string> = {
  ENV: 'bg-accent2-200 text-accent2-700',
  LINK: 'bg-neutral-200 text-neutral-700',
  DOC: 'bg-accent-200 text-accent-700',
  NOTE: 'bg-accent-200 text-accent-700',
};

export default function Store() {
  const org = useOrg();
  const project = useProject();
  const { canEdit } = usePermissions();
  const openModal = useUiStore((s) => s.openModal);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  if (!org || !project) return null;

  return (
    <div className="flex flex-col gap-4 max-w-[820px]">
      <div className="flex items-center gap-3">
        <div className="flex-1 text-[12.5px] text-neutral-600">Env files, requirement docs and links every member of this project can see.</div>
        {canEdit && <Button variant="primary" size="sm" onClick={() => openModal('storeCreateOpen')}>Add item</Button>}
      </div>
      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        {project.store.map((it) => (
          <div
            key={it.id}
            onClick={() => navigate(`?${params.toString() ? params.toString() + '&' : ''}store=${it.id}`)}
            className="flex items-center gap-3 px-4 sm:px-6 py-4 border-t border-line first:border-t-0 cursor-pointer hover:bg-neutral-200"
          >
            <div className={clsx('px-2.5 py-1 rounded-full text-[11px] font-semibold flex-none', KIND_TONE[it.kind])}>{STORE_KIND_LABEL[it.kind]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] font-semibold mb-0.5">{it.title}</div>
              <div className="text-[12.5px] text-neutral-600 truncate font-mono">{it.content}</div>
            </div>
            <div className="hidden md:block w-[170px] flex-none text-right text-xs text-neutral-600">updated {it.updatedAt} by {PEOPLE[it.updatedBy]?.name.split(' ')[0]}</div>
          </div>
        ))}
        {project.store.length === 0 && <EmptyState>Nothing stored for this project yet.</EmptyState>}
      </div>
    </div>
  );
}
