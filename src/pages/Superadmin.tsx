import { Navigate, useNavigate } from 'react-router-dom';
import { Diamond } from 'lucide-react';
import { useDataStore } from '@/store/dataStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { OrgAvatar } from '@/components/ui/Avatar';

export default function Superadmin() {
  const isSuperadmin = useAuthStore((s) => s.profile?.isSuperadmin);
  const orgs = useDataStore((s) => s.orgs);
  const toggleOrgSuspend = useDataStore((s) => s.toggleOrgSuspend);
  const navigate = useNavigate();

  if (!isSuperadmin) return <Navigate to="/orgs" replace />;

  const orgCount = orgs.length;
  const memberCount = orgs.reduce((n, o) => n + o.members.length, 0);
  const suspendedCount = orgs.filter((o) => o.status === 'SUSPENDED').length;

  return (
    <div className="h-screen overflow-y-auto px-4 sm:px-8 pt-6 pb-8 bg-canvas">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-[34px] h-[34px] flex-none rounded-full bg-accent2-200 text-accent2-700 flex items-center justify-center">
          <Diamond size={16} />
        </div>
        <h2 className="font-heading text-[26px] sm:text-[32px] leading-tight">Platform admin</h2>
      </div>
      <p className="text-neutral-600 mb-6 max-w-2xl">
        Every tenant on manage-me, outside any single organization's scope. Ordinary org data stays invisible to org admins from here on down.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        {[{ label: 'organizations', value: orgCount }, { label: 'memberships', value: memberCount }, { label: 'suspended', value: suspendedCount }].map((s) => (
          <div key={s.label} className="flex-1 min-w-[110px] bg-neutral-100 rounded-2xl p-4 shadow-sm">
            <div className="font-heading text-[28px]">{s.value}</div>
            <div className="text-[12.5px] text-neutral-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm mb-6">
        <div className="hidden sm:flex items-center gap-3 px-6 pt-4 pb-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-600">
          <div className="flex-1">Organization</div>
          <div className="w-[110px]">Members</div>
          <div className="w-[110px]">Projects</div>
          <div className="w-[120px]">Status</div>
          <div className="w-[180px]" />
        </div>
        {orgs.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-t border-line">
            <div className="flex-1 flex items-center gap-2.5 min-w-[160px]">
              <OrgAvatar initial={o.initial} size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{o.name}</div>
                <div className="text-[11.5px] text-neutral-600">{o.slug}</div>
              </div>
            </div>
            <div className="hidden sm:block w-[110px] text-sm">{o.members.length}</div>
            <div className="hidden sm:block w-[110px] text-sm">{o.projects.length}</div>
            <div className="sm:w-[120px]">
              <Pill tone={o.status === 'SUSPENDED' ? 'accent' : 'accent2'}>{o.status === 'SUSPENDED' ? 'Suspended' : 'Active'}</Pill>
            </div>
            <div className="w-full sm:w-[180px] flex gap-2 justify-end">
              <button
                onClick={() => navigate(`/o/${o.slug}/my-work`)}
                className="h-8 px-3.5 rounded-full border border-line text-[12.5px] font-semibold cursor-pointer hover:bg-ink/7"
              >
                Enter as admin
              </button>
              <button
                onClick={() => toggleOrgSuspend(o.id)}
                className={`h-8 px-3.5 rounded-full text-[12.5px] font-semibold cursor-pointer ${o.status === 'SUSPENDED' ? 'bg-accent2-200 text-accent2-700' : 'bg-accent-200 text-accent-800'}`}
              >
                {o.status === 'SUSPENDED' ? 'Reinstate' : 'Suspend'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="secondary" onClick={() => navigate('/orgs')}>← Back to organizations</Button>
    </div>
  );
}
