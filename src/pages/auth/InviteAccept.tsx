import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { OrgAvatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';

export default function InviteAccept() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const toast = useDataStore((s) => s.toast);
  const harlow = useDataStore((s) => s.orgs.find((o) => o.slug === 'harlow'));

  const accept = () => {
    signIn();
    toast(`Membership confirmed in ${harlow?.name ?? 'Harlow Studio'}`);
    navigate(`/o/${harlow?.slug ?? 'harlow'}/my-work`);
  };

  return (
    <AuthLayout width={452}>
      <div className="flex items-center gap-3 mb-4">
        <OrgAvatar initial="H" size="lg" />
        <div>
          <h3 className="font-heading text-[25px] leading-tight">Harlow Studio</h3>
          <div className="text-[13px] text-neutral-600">invited by Sam Oyelaran</div>
        </div>
      </div>
      <p className="leading-relaxed mb-4">
        You have been invited to join as an <Pill tone="accent">Admin</Pill> — you can manage members and create projects.
      </p>
      <div className="bg-canvas rounded-2xl px-4 py-3 text-[12.5px] text-neutral-600 leading-relaxed mb-6">
        The invitation is addressed to <span className="text-ink font-semibold">dana@whitlock.dev</span>, not to an account.
        Accepting it is what creates your membership in this organization.
      </div>
      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" onClick={accept}>Accept invitation</Button>
        <Link to="/login">
          <Button variant="secondary">Decline</Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
