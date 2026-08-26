import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { TextInput, Label, ErrorText } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useDataStore } from '@/store/dataStore';
import { useAuthStore } from '@/store/authStore';
import { useBillingStore } from '@/store/billingStore';
import { slugify, formatMoney } from '@/lib/format';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { ApiError } from '@/lib/api';
import type { BillingCurrency } from '@/types';
import { cn } from '@/lib/cn';

const NAME_MAX_LENGTH = 80;
const COUPON_MAX_LENGTH = 40;

interface FormErrors {
  name?: string;
  plan?: string;
  couponCode?: string;
}

export default function NewOrg() {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<BillingCurrency>('USD');
  const [planId, setPlanId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const orgs = useDataStore((s) => s.orgs);
  const toast = useDataStore((s) => s.toast);
  const fetchOrgs = useDataStore((s) => s.fetchOrgs);
  const plans = useBillingStore((s) => s.plans);
  const plansLoaded = useBillingStore((s) => s.plansLoaded);
  const fetchPlans = useBillingStore((s) => s.fetchPlans);
  const createOrgCheckout = useBillingStore((s) => s.createOrgCheckout);
  const verifyRazorpayPayment = useBillingStore((s) => s.verifyRazorpayPayment);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    if (!plansLoaded) fetchPlans().catch(() => toast('Could not load plans', 'bad'));
  }, [plansLoaded, fetchPlans, toast]);

  const selectedPlanId = planId || plans[0]?.id || '';
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const isFreePlan = selectedPlan
    ? (currency === 'INR' ? selectedPlan.priceInrPaise : selectedPlan.priceUsdCents) === 0
    : false;

  const enterCreatedOrg = async (createdOrgId: string) => {
    await fetchOrgs();
    const org = useDataStore.getState().orgs.find((o) => o.id === createdOrgId);
    if (org) navigate(`/o/${org.slug}/my-work`);
    else navigate('/orgs');
  };

  const validate = (trimmedName: string): boolean => {
    const next: FormErrors = {};
    if (!trimmedName) next.name = 'Give the organization a name';
    else if (trimmedName.length > NAME_MAX_LENGTH) next.name = `Name must be ${NAME_MAX_LENGTH} characters or fewer`;
    if (!selectedPlanId) next.plan = 'Choose a plan';
    if (couponCode.trim().length > COUPON_MAX_LENGTH) next.couponCode = `Coupon code must be ${COUPON_MAX_LENGTH} characters or fewer`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!validate(trimmed)) return;

    setSubmitting(true);
    try {
      const result = await createOrgCheckout({
        orgName: trimmed,
        planId: selectedPlanId,
        currency,
        couponCode: couponCode.trim() || undefined,
      });

      if (result.gateway === 'FREE') {
        if (result.status === 'COMPLETED' && result.createdOrgId) {
          toast(`${trimmed} created · you are its org admin`);
          await enterCreatedOrg(result.createdOrgId);
        } else {
          toast('Could not create the organization', 'bad');
        }
        return;
      }

      if (result.gateway === 'STRIPE') {
        window.location.href = result.checkoutUrl;
        return;
      }

      const payment = await openRazorpayCheckout({
        keyId: result.razorpayKeyId,
        orderId: result.orderId,
        amount: result.amount,
        currency: result.currency,
        name: 'manage-me',
        description: `Organization: ${trimmed}`,
      });
      const status = await verifyRazorpayPayment({
        checkoutSessionId: result.checkoutSessionId,
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
      });
      if (status.status === 'COMPLETED' && status.createdOrgId) {
        toast(`${trimmed} created · you are its org admin`);
        await enterCreatedOrg(status.createdOrgId);
      } else {
        toast('Payment could not be confirmed', 'bad');
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'cancelled') {
        // user closed the Razorpay modal — no toast needed
      } else if (e instanceof ApiError && /coupon/i.test(e.message)) {
        setErrors((p) => ({ ...p, couponCode: e.message }));
      } else {
        const message = e instanceof ApiError ? e.message : 'Something went wrong';
        toast(message, 'bad');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      width={460}
      topRight={
        <Button variant="secondary" size="sm" onClick={() => { signOut(); navigate('/login'); }}>
          Sign out
        </Button>
      }
    >
      <h2 className="font-heading text-[32px] leading-tight mb-2">New organization</h2>
      <p className="text-neutral-600 mb-6">
        You become its owner. {isFreePlan ? 'This plan is free — no payment needed.' : 'Creating an organization starts a paid subscription.'}
      </p>

      <div className="mb-4">
        <Label>Name</Label>
        <TextInput
          value={name}
          onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
          placeholder="Okonjo & Partners"
          maxLength={NAME_MAX_LENGTH}
          invalid={!!errors.name}
        />
        <ErrorText>{errors.name}</ErrorText>
        <div className="text-[12.5px] text-neutral-600 mt-1.5">
          {name.trim() ? `manage.me/o/${slugify(name)}` : 'The slug is derived from the name.'}
        </div>
      </div>

      <div className="mb-4">
        <Label>Currency</Label>
        <div className="flex gap-2">
          {(['USD', 'INR'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={cn(
                'h-9 px-4 rounded-full text-[13.5px] font-semibold border cursor-pointer transition-colors',
                currency === c ? 'bg-accent-200 border-accent text-accent-700' : 'border-line hover:bg-ink/7',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <Label>Plan</Label>
        {!plansLoaded ? (
          <div className="text-sm text-neutral-600">Loading plans…</div>
        ) : plans.length === 0 ? (
          <div className="text-sm text-neutral-600">No plans available right now.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setPlanId(p.id); if (errors.plan) setErrors((prev) => ({ ...prev, plan: undefined })); }}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left cursor-pointer transition-colors',
                  selectedPlanId === p.id ? 'border-accent bg-accent-200/40' : 'border-line hover:bg-ink/7',
                )}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  {p.description && <div className="text-[12.5px] text-neutral-600 truncate">{p.description}</div>}
                </div>
                <div className="text-sm font-semibold whitespace-nowrap">
                  {(currency === 'INR' ? p.priceInrPaise : p.priceUsdCents) === 0
                    ? 'Free'
                    : (
                      <>
                        {formatMoney(currency === 'INR' ? p.priceInrPaise : p.priceUsdCents, currency)}
                        <span className="text-neutral-600 font-normal"> / {p.periodDays}d</span>
                      </>
                    )}
                </div>
              </button>
            ))}
          </div>
        )}
        <ErrorText>{errors.plan}</ErrorText>
      </div>

      <div className="mb-6">
        <Label>Coupon code (optional)</Label>
        <TextInput
          value={couponCode}
          onChange={(e) => { setCouponCode(e.target.value); if (errors.couponCode) setErrors((p) => ({ ...p, couponCode: undefined })); }}
          placeholder="SAVE20"
          maxLength={COUPON_MAX_LENGTH}
          invalid={!!errors.couponCode}
        />
        <ErrorText>{errors.couponCode}</ErrorText>
      </div>

      <Button variant="primary" className="w-full" onClick={submit} disabled={submitting || !plansLoaded || plans.length === 0}>
        {submitting ? (isFreePlan ? 'Creating…' : 'Starting checkout…') : (isFreePlan ? 'Create organization' : 'Continue to payment')}
      </Button>
      <button onClick={() => navigate(orgs.length ? '/orgs' : '/login')} className="block w-full text-center mt-4 text-[13px] text-accent-700 font-semibold cursor-pointer">
        Back
      </button>
    </AuthLayout>
  );
}
