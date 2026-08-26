import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { TextInput, PasswordInput, ErrorText } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { isValidEmail } from '@/lib/validation';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signIn = useAuthStore((s) => s.signIn);
  const toast = useDataStore((s) => s.toast);
  const fetchOrgs = useDataStore((s) => s.fetchOrgs);
  const fetchDiscoverable = useDataStore((s) => s.fetchDiscoverable);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await signIn(email, password);
      await Promise.all([fetchOrgs(), fetchDiscoverable()]);
      const orgs = useDataStore.getState().orgs;
      const isSuperadmin = useAuthStore.getState().profile?.isSuperadmin;
      toast(`Signed in · ${orgs.length} membership${orgs.length === 1 ? '' : 's'} found`);
      const redirect = params.get('redirect');
      navigate(redirect ?? (isSuperadmin ? '/admin' : orgs.length === 1 ? `/o/${orgs[0].slug}/my-work` : '/orgs'));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not sign in', 'bad');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="font-heading text-[32px] leading-tight mb-2">manage-me</h2>
      <p className="text-neutral-600 mb-6">Sign in to your organizations.</p>
      <OAuthButtons />
      <div className="mb-3">
        <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600 mb-1">Email</div>
        <TextInput
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          invalid={!!errors.email}
        />
        <ErrorText>{errors.email}</ErrorText>
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600">Password</div>
          <Link to="/forgot-password" className="text-[12px] text-accent-700 font-semibold no-underline">Forgot password?</Link>
        </div>
        <PasswordInput
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          invalid={!!errors.password}
        />
        <ErrorText>{errors.password}</ErrorText>
      </div>
      <Button variant="primary" className="w-full mt-4" onClick={submit} disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>
      <div className="flex gap-4 justify-center mt-4">
        <Link to="/signup" className="text-[13px] text-accent-700 font-semibold no-underline">Create an account</Link>
      </div>
    </AuthLayout>
  );
}
