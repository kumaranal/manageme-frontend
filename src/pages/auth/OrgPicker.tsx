import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { OrgAvatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useDataStore } from '@/store/dataStore';
import { useMe } from '@/hooks/useScope';
import { orgRole } from '@/lib/permissions';

export default function OrgPicker() {
  const navigate = useNavigate();
  const orgs = useDataStore((s) => s.orgs);
  const discoverable = useDataStore((s) => s.discoverableOrgs);
  const me = useMe();

  return (
    <AuthLayout width={492}>
      <h2 className="font-heading text-[32px] leading-tight mb-2">Choose an organization</h2>
      <p className="text-neutral-600 mb-6">
        Your account has {orgs.length} membership{orgs.length === 1 ? '' : 's'}. Each one is a separate tenant — nothing crosses between them.
      </p>
      <div className="flex flex-col gap-3">
        {orgs.map((o) => {
          const role = orgRole(o, me);
          return (
            <button
              key={o.id}
              onClick={() => navigate(`/o/${o.slug}/my-work`)}
              className="flex items-center gap-4 bg-neutral-100 rounded-3xl px-6 py-4 cursor-pointer shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <OrgAvatar initial={o.initial} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="font-heading text-xl leading-tight">{o.name}</div>
                <div className="text-[13px] text-neutral-600">
                  {role === 'ORG_ADMIN' ? 'org admin' : 'member'} · {o.projects.length} project{o.projects.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="text-[13px] font-semibold text-accent-700">Open →</div>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="secondary" onClick={() => navigate('/orgs/new')}>Create a new organization</Button>
        {discoverable.length > 0 && (
          <Button variant="secondary" onClick={() => navigate('/orgs/join')}>Join an organization</Button>
        )}
      </div>
    </AuthLayout>
  );
}
