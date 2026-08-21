import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { TextInput } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';

export default function Login() {
  const [email, setEmail] = useState('dana@whitlock.dev');
  const [password, setPassword] = useState('correct-horse-battery');
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const orgs = useDataStore((s) => s.orgs);
  const toast = useDataStore((s) => s.toast);

  const submit = () => {
    if (!email.includes('@')) {
      toast('That email will not do', 'bad');
      return;
    }
    signIn();
    toast(`Signed in · ${orgs.length} memberships found`);
    navigate(orgs.length === 1 ? `/o/${orgs[0].slug}/my-work` : '/orgs');
  };

  return (
    <AuthLayout>
      <h2 className="font-heading text-[32px] leading-tight mb-2">manage-me</h2>
      <p className="text-neutral-600 mb-6">Sign in to your organizations.</p>
      <div className="mb-3">
        <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600 mb-1">Email</div>
        <TextInput value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>
      <div className="mb-6">
        <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600 mb-1">Password</div>
        <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>
      <Button variant="primary" className="w-full" onClick={submit}>Sign in</Button>
      <div className="flex gap-4 justify-center mt-4">
        <Link to="/signup" className="text-[13px] text-accent-700 font-semibold no-underline">Create an account</Link>
        <Link to="/invite/demo" className="text-[13px] text-accent-700 font-semibold no-underline">Open an invitation</Link>
      </div>
    </AuthLayout>
  );
}
