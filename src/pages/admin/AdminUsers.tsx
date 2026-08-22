import { useEffect, useState } from 'react';
import { useAdminStore, adminErrorMessage } from '@/store/adminStore';
import { useDataStore } from '@/store/dataStore';
import { TextInput } from '@/components/ui/Field';
import { Pill } from '@/components/ui/Pill';
import { Pagination } from '@/components/ui/Pagination';

export default function AdminUsers() {
  const users = useAdminStore((s) => s.users);
  const fetchUsers = useAdminStore((s) => s.fetchUsers);
  const toast = useDataStore((s) => s.toast);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers(1, query).catch((e) => toast(adminErrorMessage(e), 'bad'));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const goToPage = (p: number) => {
    fetchUsers(p, query).catch((e) => toast(adminErrorMessage(e), 'bad'));
  };

  return (
    <div>
      <TextInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email…"
        className="max-w-sm mb-4"
      />

      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="hidden sm:flex items-center gap-3 px-6 pt-4 pb-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-600">
          <div className="flex-1">User</div>
          <div className="w-[110px]">Orgs</div>
          <div className="w-[130px]">Role</div>
        </div>
        {!users ? (
          <div className="px-6 py-6 text-sm text-neutral-600">Loading…</div>
        ) : users.items.length === 0 ? (
          <div className="px-6 py-6 text-sm text-neutral-600">No users found.</div>
        ) : (
          users.items.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-t border-line">
              <div className="flex-1 min-w-[160px]">
                <div className="text-sm font-semibold truncate">{u.name}</div>
                <div className="text-[11.5px] text-neutral-600 truncate">{u.email}</div>
              </div>
              <div className="w-full sm:w-[110px] text-sm">{u.orgCount}</div>
              <div className="sm:w-[130px]">
                {u.isSuperadmin && <Pill tone="accent2">Superadmin</Pill>}
              </div>
            </div>
          ))
        )}
      </div>

      {users && (
        <Pagination page={users.page} pageSize={users.pageSize} total={users.total} onChange={goToPage} />
      )}
    </div>
  );
}
