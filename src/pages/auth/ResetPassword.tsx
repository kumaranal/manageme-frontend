import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { PasswordInput, ErrorText } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { passwordError } from '@/lib/validation';

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const toast = useDataStore((s) => s.toast);

  useEffect(() => {
    let cancelled = false;
    let resolved = false;

    const markReady = () => {
      if (cancelled || resolved) return;
      resolved = true;
      clearTimeout(timeout);
      setReady(true);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) markReady();
    });

    const timeout = setTimeout(() => {
      if (!cancelled && !resolved) setInvalidLink(true);
    }, 5000);

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const validate = (): boolean => {
    const next: FormErrors = {};
    const pwError = passwordError(password);
    if (pwError) next.password = pwError;
    else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await updatePassword(password);
      toast('Password updated · sign in with your new password');
      navigate('/login');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update password', 'bad');
    } finally {
      setSubmitting(false);
    }
  };

  if (invalidLink) {
    return (
      <AuthLayout>
        <h2 className="font-heading text-[32px] leading-tight mb-2">Link expired</h2>
        <p className="text-neutral-600 mb-6">This password reset link is invalid or has expired. Request a new one.</p>
        <Link to="/forgot-password">
          <Button variant="primary" className="w-full">Request new link</Button>
        </Link>
      </AuthLayout>
    );
  }

  if (!ready) {
    return (
      <AuthLayout>
        <h2 className="font-heading text-[32px] leading-tight mb-2">Verifying link…</h2>
        <p className="text-neutral-600">Hang on a moment.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h2 className="font-heading text-[32px] leading-tight mb-2">Set a new password</h2>
      <p className="text-neutral-600 mb-6">Choose a new password for your account.</p>
      <div className="mb-3">
        <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600 mb-1">New password</div>
        <PasswordInput
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          invalid={!!errors.password}
        />
        <ErrorText>{errors.password}</ErrorText>
      </div>
      <div className="mb-6">
        <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600 mb-1">Confirm password</div>
        <PasswordInput
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          invalid={!!errors.confirmPassword}
        />
        <ErrorText>{errors.confirmPassword}</ErrorText>
      </div>
      <Button variant="primary" className="w-full" onClick={submit} disabled={submitting}>
        {submitting ? 'Updating…' : 'Update password'}
      </Button>
    </AuthLayout>
  );
}
