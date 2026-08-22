import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { OrgAvatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { api, ApiError } from '@/lib/api';
import type { OrgRole } from '@/types';

interface InvitePreview {
  orgName: string;
  orgSlug: string;
  orgInitial: string;
  role: OrgRole;
  email: string;
}

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const myEmail = useAuthStore((s) => s.profile?.email);
  const acceptInvite = useDataStore((s) => s.acceptInvite);

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get<InvitePreview>(`/invites/${token}`)
      .then(setPreview)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load this invitation'));
  }, [token]);

  const accept = async () => {
    if (!token) return;
    setAccepting(true);
    const org = await acceptInvite(token);
    setAccepting(false);
    if (org) navigate(`/o/${org.slug}/my-work`);
  };

  if (error) {
    return (
      <AuthLayout width={452}>
        <h3 className="font-heading text-[25px] leading-tight mb-2">Invitation not found</h3>
        <p className="text-neutral-600 mb-6">{error}</p>
        <Link to="/login"><Button variant="secondary" className="w-full">Back to sign in</Button></Link>
      </AuthLayout>
    );
  }

  if (!preview) {
    return (
      <AuthLayout width={452}>
        <p className="text-neutral-600">Loading invitation…</p>
      </AuthLayout>
    );
  }

  const redirect = `/invite/${token}`;

  return (
    <AuthLayout width={452}>
      <div className="flex items-center gap-3 mb-4">
        <OrgAvatar initial={preview.orgInitial} size="lg" />
        <div>
          <h3 className="font-heading text-[25px] leading-tight">{preview.orgName}</h3>
        </div>
      </div>
      <p className="leading-relaxed mb-4">
        You have been invited to join as{' '}
        <Pill tone="accent">{preview.role === 'ORG_ADMIN' ? 'Admin' : 'Member'}</Pill>
        {preview.role === 'ORG_ADMIN' ? ' — you can manage members and create projects.' : '.'}
      </p>
      <div className="bg-canvas rounded-2xl px-4 py-3 text-[12.5px] text-neutral-600 leading-relaxed mb-6">
        The invitation is addressed to <span className="text-ink font-semibold">{preview.email}</span>, not to an account.
        Accepting it is what creates your membership in this organization.
      </div>

      {isAuthenticated ? (
        myEmail && myEmail.toLowerCase() !== preview.email.toLowerCase() ? (
          <div className="text-[13px] text-accent-700">
            You are signed in as {myEmail}, but this invite is addressed to {preview.email}. Sign out and try again with the right account.
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" onClick={accept} disabled={accepting}>
              {accepting ? 'Accepting…' : 'Accept invitation'}
            </Button>
            <Link to="/orgs"><Button variant="secondary">Decline</Button></Link>
          </div>
        )
      ) : (
        <div className="flex gap-2">
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="flex-1">
            <Button variant="primary" className="w-full">Sign in to accept</Button>
          </Link>
          <Link to={`/signup?redirect=${encodeURIComponent(redirect)}`}>
            <Button variant="secondary">Create account</Button>
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
