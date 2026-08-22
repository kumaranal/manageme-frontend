import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { OrgAvatar } from '@/components/ui/Avatar';
import { useDataStore } from '@/store/dataStore';

export default function JoinOrg() {
  const navigate = useNavigate();
  const discoverable = useDataStore((s) => s.discoverableOrgs);
  const joinDiscoverableOrg = useDataStore((s) => s.joinDiscoverableOrg);

  const join = async (id: string, slug: string) => {
    const joinedId = await joinDiscoverableOrg(id);
    if (joinedId) navigate(`/o/${slug}/my-work`);
  };

  return (
    <AuthLayout width={452}>
      <h2 className="font-heading text-[32px] leading-tight mb-2">Join an organization</h2>
      <p className="text-neutral-600 mb-6">You join as a member — access to specific projects is granted afterwards by an org admin.</p>
      <div className="flex flex-col gap-2.5 mb-6">
        {discoverable.map((o) => (
          <div key={o.id} className="flex items-center gap-4 bg-canvas rounded-2xl px-4 py-3">
            <OrgAvatar initial={o.initial} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="font-heading text-[17px]">{o.name}</div>
              <div className="text-xs text-neutral-600">manage.me/o/{o.slug}</div>
            </div>
            <button
              onClick={() => join(o.id, o.slug)}
              className="h-[34px] px-4 rounded-full bg-accent text-canvas text-[13px] font-semibold cursor-pointer hover:bg-accent-600"
            >
              Join
            </button>
          </div>
        ))}
        {discoverable.length === 0 && <div className="text-sm text-neutral-600">No organizations to join right now.</div>}
      </div>
      <button onClick={() => navigate('/orgs')} className="block w-full text-center text-[13px] text-accent-700 font-semibold cursor-pointer">
        Back
      </button>
    </AuthLayout>
  );
}
