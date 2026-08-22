import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { TextInput } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signUp = useAuthStore((s) => s.signUp);
  const toast = useDataStore((s) => s.toast);

  const submit = async () => {
    if (!name.trim()) {
      toast('Enter your full name', 'bad');
      return;
    }
    if (!email.includes('@')) {
      toast('Enter a valid email address', 'bad');
      return;
    }
    if (password.length < 8) {
      toast('Password must be at least 8 characters', 'bad');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, name.trim());
      if (useAuthStore.getState().isAuthenticated) {
        const redirect = params.get('redirect');
        toast('Account created · no memberships yet');
        navigate(redirect ?? '/orgs/new');
      } else {
        setAwaitingConfirmation(true);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not create account', 'bad');
    } finally {
      setSubmitting(false);
    }
  };

  if (awaitingConfirmation) {
    return (
      <AuthLayout>
        <h2 className="font-heading text-[32px] leading-tight mb-2">Check your email</h2>
        <p className="text-neutral-600 mb-6">
          We sent a confirmation link to <span className="text-ink font-semibold">{email}</span>. Follow it, then sign in.
        </p>
        <Link to="/login">
          <Button variant="primary" className="w-full">Back to sign in</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h2 className="font-heading text-[32px] leading-tight mb-2">Create an account</h2>
      <p className="text-neutral-600 mb-6">One identity, any number of organizations.</p>
      <OAuthButtons />
      <div className="mb-3">
        <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600 mb-1">Full name</div>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Okonjo" />
      </div>
      <div className="mb-3">
        <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600 mb-1">Work email</div>
        <TextInput value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="mb-6">
        <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600 mb-1">Password</div>
        <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>
      <Button variant="primary" className="w-full" onClick={submit} disabled={submitting}>
        {submitting ? 'Creating…' : 'Continue'}
      </Button>
      <div className="text-center mt-4">
        <Link to="/login" className="text-[13px] text-accent-700 font-semibold no-underline">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
