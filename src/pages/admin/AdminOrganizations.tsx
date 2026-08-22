import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore, adminErrorMessage } from '@/store/adminStore';
import { useDataStore } from '@/store/dataStore';
import { TextInput } from '@/components/ui/Field';
import { Pill } from '@/components/ui/Pill';
import { Pagination } from '@/components/ui/Pagination';
import { formatDue } from '@/lib/format';

export default function AdminOrganizations() {
  const organizations = useAdminStore((s) => s.organizations);
  const fetchOrganizations = useAdminStore((s) => s.fetchOrganizations);
  const toggleOrgSuspend = useDataStore((s) => s.toggleOrgSuspend);
  const toast = useDataStore((s) => s.toast);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchOrganizations(1, query).catch((e) => toast(adminErrorMessage(e), 'bad'));
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchOrganizations(p, query).catch((e) => toast(adminErrorMessage(e), 'bad'));
  };

  const suspend = async (orgId: string) => {
    await toggleOrgSuspend(orgId);
    await fetchOrganizations(page, query);
  };

  return (
    <div>
      <TextInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or slug…"
        className="max-w-sm mb-4"
      />

      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="hidden sm:flex items-center gap-3 px-6 pt-4 pb-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-600">
          <div className="flex-1">Organization</div>
          <div className="w-[130px]">Plan</div>
          <div className="w-[90px]">Members</div>
          <div className="w-[90px]">Projects</div>
          <div className="w-[130px]">Renews</div>
          <div className="w-[100px]">Status</div>
          <div className="w-[180px]" />
        </div>
        {!organizations ? (
          <div className="px-6 py-6 text-sm text-neutral-600">Loading…</div>
        ) : organizations.items.length === 0 ? (
          <div className="px-6 py-6 text-sm text-neutral-600">No organizations found.</div>
        ) : (
          organizations.items.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-t border-line">
              <div className="flex-1 min-w-[160px]">
                <div className="text-sm font-semibold truncate">{o.name}</div>
                <div className="text-[11.5px] text-neutral-600">{o.slug}</div>
              </div>
              <div className="w-full sm:w-[130px] text-sm">
                {o.plan ? o.plan.name : <span className="text-neutral-600">—</span>}
              </div>
              <div className="w-full sm:w-[90px] text-sm">{o.memberCount}</div>
              <div className="w-full sm:w-[90px] text-sm">{o.projectCount}</div>
              <div className="w-full sm:w-[130px] text-sm">
                {o.currentPeriodEnd ? formatDue(o.currentPeriodEnd.slice(0, 10)) : '—'}
                {o.currentPeriodEnd && !o.subscriptionActive && <span className="text-accent-700"> (lapsed)</span>}
              </div>
              <div className="sm:w-[100px]">
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
                  onClick={() => suspend(o.id)}
                  className={`h-8 px-3.5 rounded-full text-[12.5px] font-semibold cursor-pointer ${o.status === 'SUSPENDED' ? 'bg-accent2-200 text-accent2-700' : 'bg-accent-200 text-accent-800'}`}
                >
                  {o.status === 'SUSPENDED' ? 'Reinstate' : 'Suspend'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {organizations && (
        <Pagination page={organizations.page} pageSize={organizations.pageSize} total={organizations.total} onChange={goToPage} />
      )}
    </div>
  );
}
