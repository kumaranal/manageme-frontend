import { useOrg, usePermissions, useMe } from '@/hooks/useScope';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Field';
import { useUiStore } from '@/store/uiStore';
import { useDataStore } from '@/store/dataStore';
import { usePeopleStore } from '@/store/peopleStore';
import { timeAgo } from '@/lib/format';
import type { OrgRole } from '@/types';

export default function Members() {
  const org = useOrg();
  const me = useMe();
  const { isOrgAdmin } = usePermissions();
  const openModal = useUiStore((s) => s.openModal);
  const updateMemberRole = useDataStore((s) => s.updateMemberRole);
  const removeMember = useDataStore((s) => s.removeMember);
  const revokeInvite = useDataStore((s) => s.revokeInvite);
  const toast = useDataStore((s) => s.toast);
  const people = usePeopleStore((s) => s.people);
  if (!org) return null;

  const adminCount = org.members.filter((m) => m.role === 'ORG_ADMIN').length;

  return (
    <div className="flex flex-col gap-4 max-w-[1000px]">
      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center px-4 sm:px-6 pt-4 pb-3">
          <div className="flex-1 font-heading text-xl">Organization members</div>
          {isOrgAdmin && <Button variant="secondary" size="sm" onClick={() => openModal('inviteOpen')}>Invite people</Button>}
        </div>
        {org.members.map((m) => {
          const person = people[m.userId];
          const inProjects = org.projects.filter((pr) => pr.members.some((x) => x.userId === m.userId)).map((pr) => pr.key);
          const lastAdmin = m.role === 'ORG_ADMIN' && adminCount === 1;
          const editable = isOrgAdmin && !lastAdmin;
          const removable = isOrgAdmin && !lastAdmin && m.userId !== me;
          return (
            <div key={m.userId} className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-t border-line">
              <Avatar userId={m.userId} />
              <div className="flex-1 min-w-[120px]">
                <div className="text-sm font-semibold">{person?.name}</div>
                <div className="text-[12.5px] text-neutral-600">{person?.email}</div>
              </div>
              <div className="hidden lg:block w-40 text-xs text-neutral-600">{inProjects.length ? inProjects.join(' · ') : 'no projects yet'}</div>
              {editable ? (
                <Select
                  value={m.role}
                  onChange={(e) => { updateMemberRole(org.id, m.userId, e.target.value as OrgRole); toast(`${person?.name} is now ${e.target.value.toLowerCase()}`); }}
                  className="h-[34px] w-auto text-[13px]"
                >
                  <option value="ORG_ADMIN">Org admin</option>
                  <option value="MEMBER">Member</option>
                </Select>
              ) : (
                <div title={lastAdmin ? 'The last org admin cannot be demoted' : 'Only an org admin changes roles'} className="px-3 py-1.5 rounded-full bg-neutral-200 text-neutral-700 text-[12.5px] font-semibold">
                  {m.role === 'ORG_ADMIN' ? 'Org admin' : 'Member'}
                </div>
              )}
              {removable && (
                <button
                  onClick={() => { removeMember(org.id, m.userId); toast(`${person?.name} removed from ${org.name}`); }}
                  className="text-[13px] text-neutral-600 hover:text-accent-700 font-semibold cursor-pointer px-2"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 pt-4 pb-3 font-heading text-xl">Pending invitations</div>
        {org.invites.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-t border-line">
            <div className="flex-1 min-w-[160px]">
              <div className="text-sm font-semibold">{i.email}</div>
              <div className="text-[12.5px] text-neutral-600">{i.role.toLowerCase()} · sent {timeAgo(i.at)}</div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/invite/${i.token}`);
                toast('Invite link copied');
              }}
              className="h-[34px] px-4 rounded-full border border-line text-[13px] font-semibold cursor-pointer hover:bg-ink/7"
            >
              Copy link
            </button>
            <button
              onClick={() => revokeInvite(org.id, i.id)}
              className="text-[13px] text-neutral-600 hover:text-accent-700 font-semibold cursor-pointer px-2"
            >
              Revoke
            </button>
          </div>
        ))}
        {org.invites.length === 0 && <EmptyState>No invitations outstanding.</EmptyState>}
      </div>
    </div>
  );
}
