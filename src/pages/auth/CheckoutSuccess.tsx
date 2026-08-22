import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { useDataStore } from '@/store/dataStore';
import { useBillingStore } from '@/store/billingStore';
import type { CheckoutSessionStatus } from '@/types';

const POLL_MS = 1500;
const MAX_ATTEMPTS = 40; // ~1 minute

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const fetchOrgs = useDataStore((s) => s.fetchOrgs);
  const toast = useDataStore((s) => s.toast);
  const getCheckoutStatus = useBillingStore((s) => s.getCheckoutStatus);
  const [status, setStatus] = useState<CheckoutSessionStatus | 'MISSING'>(sessionId ? 'PENDING' : 'MISSING');
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const result = await getCheckoutStatus(sessionId);
        if (cancelled) return;
        if (result.status === 'PENDING') {
          attempts.current += 1;
          if (attempts.current >= MAX_ATTEMPTS) {
            setStatus('FAILED');
            return;
          }
          setTimeout(poll, POLL_MS);
          return;
        }
        setStatus(result.status);
        if (result.status === 'COMPLETED' && result.createdOrgId) {
          await fetchOrgs();
          const org = useDataStore.getState().orgs.find((o) => o.id === result.createdOrgId);
          toast(org ? `${org.name} created · you are its org admin` : 'Organization created');
          navigate(org ? `/o/${org.slug}/my-work` : '/orgs');
        }
      } catch {
        if (!cancelled) setStatus('FAILED');
      }
    };
    poll();

    return () => { cancelled = true; };
  }, [sessionId, getCheckoutStatus, fetchOrgs, toast, navigate]);

  return (
    <AuthLayout>
      {status === 'MISSING' ? (
        <>
          <h2 className="font-heading text-[28px] leading-tight mb-2">Missing checkout session</h2>
          <p className="text-neutral-600 mb-6">This link is missing its session id.</p>
        </>
      ) : status === 'PENDING' ? (
        <>
          <h2 className="font-heading text-[28px] leading-tight mb-2">Confirming payment…</h2>
          <p className="text-neutral-600 mb-6">This usually takes a few seconds.</p>
        </>
      ) : status === 'COMPLETED' ? (
        <>
          <h2 className="font-heading text-[28px] leading-tight mb-2">Payment confirmed</h2>
          <p className="text-neutral-600 mb-6">Taking you to your new organization…</p>
        </>
      ) : (
        <>
          <h2 className="font-heading text-[28px] leading-tight mb-2">
            {status === 'EXPIRED' ? 'Checkout expired' : 'Could not confirm payment'}
          </h2>
          <p className="text-neutral-600 mb-6">
            If you were charged, contact support with your session id{sessionId ? ` (${sessionId})` : ''}.
          </p>
        </>
      )}
      <Button variant="secondary" className="w-full" onClick={() => navigate('/orgs/new')}>Back to new organization</Button>
    </AuthLayout>
  );
}
