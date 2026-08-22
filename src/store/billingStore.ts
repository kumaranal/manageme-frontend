import { create } from 'zustand';
import { api } from '@/lib/api';
import type {
  SubscriptionPlan, BillingCurrency, CheckoutStartResult, CheckoutStatusResult,
} from '@/types';

interface BillingState {
  plans: SubscriptionPlan[];
  plansLoaded: boolean;
  fetchPlans: () => Promise<void>;
  createOrgCheckout: (params: { orgName: string; planId: string; currency: BillingCurrency; couponCode?: string }) => Promise<CheckoutStartResult>;
  getCheckoutStatus: (checkoutSessionId: string) => Promise<CheckoutStatusResult>;
  verifyRazorpayPayment: (params: { checkoutSessionId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => Promise<CheckoutStatusResult>;
}

export const useBillingStore = create<BillingState>((set) => ({
  plans: [],
  plansLoaded: false,

  fetchPlans: async () => {
    const plans = await api.get<SubscriptionPlan[]>('/billing/plans');
    set({ plans, plansLoaded: true });
  },

  createOrgCheckout: (params) =>
    api.post<CheckoutStartResult>('/billing/checkout/organizations', params),

  getCheckoutStatus: (checkoutSessionId) =>
    api.get<CheckoutStatusResult>(`/billing/checkout/${checkoutSessionId}`),

  verifyRazorpayPayment: (params) =>
    api.post<CheckoutStatusResult>('/billing/checkout/razorpay/verify', params),
}));
