import { create } from 'zustand';
import { api, ApiError } from '@/lib/api';
import type {
  AdminOverview, AdminOrgRow, AdminUserRow, AdminPayment, Coupon, SubscriptionPlan,
  Paginated, BillingCurrency, PaymentGateway, CouponDiscountType,
} from '@/types';

export interface CreatePlanInput {
  name: string;
  description?: string;
  periodDays: number;
  priceInrPaise: number;
  priceUsdCents: number;
  active?: boolean;
}
export type UpdatePlanInput = Partial<CreatePlanInput>;

export interface CreateCouponInput {
  code: string;
  discountType: CouponDiscountType;
  percentOff?: number;
  fixedOffInrPaise?: number;
  fixedOffUsdCents?: number;
  maxRedemptions?: number;
  active?: boolean;
  expiresAt?: string;
}
export type UpdateCouponInput = Partial<Omit<CreateCouponInput, 'code' | 'discountType'>>;

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')}`;
}

interface AdminState {
  overview: AdminOverview | null;
  fetchOverview: () => Promise<void>;

  organizations: Paginated<AdminOrgRow> | null;
  fetchOrganizations: (page?: number, query?: string) => Promise<void>;

  users: Paginated<AdminUserRow> | null;
  fetchUsers: (page?: number, query?: string) => Promise<void>;

  payments: Paginated<AdminPayment> | null;
  fetchPayments: (page?: number, gateway?: PaymentGateway, currency?: BillingCurrency) => Promise<void>;

  plans: SubscriptionPlan[];
  fetchPlans: () => Promise<void>;
  createPlan: (input: CreatePlanInput) => Promise<void>;
  updatePlan: (id: string, input: UpdatePlanInput) => Promise<void>;

  coupons: Coupon[];
  fetchCoupons: () => Promise<void>;
  createCoupon: (input: CreateCouponInput) => Promise<void>;
  updateCoupon: (id: string, input: UpdateCouponInput) => Promise<void>;

  error: string | null;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  overview: null,
  fetchOverview: async () => {
    const overview = await api.get<AdminOverview>('/admin/analytics/overview');
    set({ overview });
  },

  organizations: null,
  fetchOrganizations: async (page = 1, query = '') => {
    const organizations = await api.get<Paginated<AdminOrgRow>>(
      `/admin/analytics/organizations${qs({ page, query })}`,
    );
    set({ organizations });
  },

  users: null,
  fetchUsers: async (page = 1, query = '') => {
    const users = await api.get<Paginated<AdminUserRow>>(
      `/admin/analytics/users${qs({ page, query })}`,
    );
    set({ users });
  },

  payments: null,
  fetchPayments: async (page = 1, gateway?, currency?) => {
    const payments = await api.get<Paginated<AdminPayment>>(
      `/admin/payments${qs({ page, gateway, currency })}`,
    );
    set({ payments });
  },

  plans: [],
  fetchPlans: async () => {
    const plans = await api.get<SubscriptionPlan[]>('/admin/plans');
    set({ plans });
  },
  createPlan: async (input) => {
    await api.post('/admin/plans', input);
    await get().fetchPlans();
  },
  updatePlan: async (id, input) => {
    await api.patch(`/admin/plans/${id}`, input);
    await get().fetchPlans();
  },

  coupons: [],
  fetchCoupons: async () => {
    const coupons = await api.get<Coupon[]>('/admin/coupons');
    set({ coupons });
  },
  createCoupon: async (input) => {
    await api.post('/admin/coupons', input);
    await get().fetchCoupons();
  },
  updateCoupon: async (id, input) => {
    await api.patch(`/admin/coupons/${id}`, input);
    await get().fetchCoupons();
  },

  error: null,
}));

export function adminErrorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Something went wrong';
}
