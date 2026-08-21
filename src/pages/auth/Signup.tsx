import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { TextInput } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const toast = useDataStore((s) => s.toast);

  const submit = () => {
    if (!email.includes('@')) {
      toast('Enter a valid email address', 'bad');
      return;
    }
    signIn();
    toast('Account created · no memberships yet');
    navigate('/orgs/new');
  };

  return (
    <AuthLayout>
      <h2 className="font-heading text-[32px] leading-tight mb-2">Create an account</h2>
      <p className="text-neutral-600 mb-6">One identity, any number of organizations.</p>
      <div className="mb-3">
        <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600 mb-1">Full name</div>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Okonjo" />
      </div>
      <div className="mb-6">
        <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600 mb-1">Work email</div>
        <TextInput value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button variant="primary" className="w-full" onClick={submit}>Continue</Button>
      <div className="text-center mt-4">
        <Link to="/login" className="text-[13px] text-accent-700 font-semibold no-underline">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
