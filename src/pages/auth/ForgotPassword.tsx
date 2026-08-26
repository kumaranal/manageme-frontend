import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { TextInput, ErrorText } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { isValidEmail } from '@/lib/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  const toast = useDataStore((s) => s.toast);

  const submit = async () => {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not send reset email', 'bad');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout>
        <h2 className="font-heading text-[32px] leading-tight mb-2">Check your email</h2>
        <p className="text-neutral-600 mb-6">
          If an account exists for <span className="text-ink font-semibold">{email}</span>, we sent a link to reset your password.
        </p>
        <Link to="/login">
          <Button variant="primary" className="w-full">Back to sign in</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h2 className="font-heading text-[32px] leading-tight mb-2">Reset your password</h2>
      <p className="text-neutral-600 mb-6">Enter your email and we&apos;ll send you a link to reset it.</p>
      <div className="mb-6">
        <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600 mb-1">Email</div>
        <TextInput
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(undefined); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          invalid={!!error}
        />
        <ErrorText>{error}</ErrorText>
      </div>
      <Button variant="primary" className="w-full" onClick={submit} disabled={submitting}>
        {submitting ? 'Sending…' : 'Send reset link'}
      </Button>
      <div className="text-center mt-4">
        <Link to="/login" className="text-[13px] text-accent-700 font-semibold no-underline">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
