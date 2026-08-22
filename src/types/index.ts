export type OrgRole = 'ORG_ADMIN' | 'MEMBER';
export type ProjectRole = 'LEAD' | 'CONTRIBUTOR' | 'VIEWER';
export type OrgStatus = 'ACTIVE' | 'SUSPENDED';
export type StatusCategory = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type IssueType = 'Task' | 'Story' | 'Bug';
export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'CLOSED';
export type StoreKind = 'DOC' | 'ENV' | 'LINK' | 'NOTE';
export type WorkloadPeriod = 'day' | 'week' | 'month';

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  isSuperadmin?: boolean;
}

export interface Membership {
  userId: string;
  role: OrgRole;
}

export interface Invite {
  id: string;
  email: string;
  role: OrgRole;
  at: string;
  token: string;
}

export interface ProjectMembership {
  userId: string;
  role: ProjectRole;
  weeklyHours?: number | null;
}

export interface TaskField {
  id: 'priority' | 'assignee' | 'dueDate' | 'labels' | 'estimatedHours';
  label: string;
  enabled: boolean;
  required: boolean;
}

export interface Status {
  id: string;
  name: string;
  category: StatusCategory;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
}

export interface Comment {
  id: string;
  author: string;
  body: string;
  at: string;
}

export interface ActivityEntry {
  id: string;
  actor: string;
  text: string;
  at: string;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  type: IssueType;
  priority: Priority;
  assignee: string | null;
  statusId: string;
  rank: number;
  due: string | null;
  labels: string[];
  cc: string[];
  comments: Comment[];
  estimatedHours: number | null;
  sprintId?: string | null;
  activity: ActivityEntry[];
}

export interface StoreHistoryEntry {
  actor: string;
  text: string;
  at: string;
}

export interface StoreItem {
  id: string;
  title: string;
  kind: StoreKind;
  content: string;
  updatedBy: string;
  updatedAt: string;
  history: StoreHistoryEntry[];
}

export interface Project {
  id: string;
  key: string;
  name: string;
  blurb: string;
  lead: string;
  counter: number;
  archived?: boolean;
  taskFields: TaskField[];
  sprints: Sprint[];
  sprintConfig: { lengthWeeks: number };
  store: StoreItem[];
  members: ProjectMembership[];
  statuses: Status[];
  issues: Issue[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  initial: string;
  status: OrgStatus;
  capacityHoursPerWeek: number;
  members: Membership[];
  invites: Invite[];
  projects: Project[];
}

export interface DiscoverableOrg {
  id: string;
  name: string;
  slug: string;
  initial: string;
}

export type BillingCurrency = 'INR' | 'USD';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  periodDays: number;
  priceInrPaise: number;
  priceUsdCents: number;
  active: boolean;
}

export type CheckoutSessionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export interface CheckoutStatusResult {
  status: CheckoutSessionStatus;
  createdOrgId: string | null;
  renewOrgId: string | null;
}

export type CheckoutStartResult =
  | { gateway: 'STRIPE'; checkoutSessionId: string; checkoutUrl: string; amount: number; currency: BillingCurrency }
  | { gateway: 'RAZORPAY'; checkoutSessionId: string; razorpayKeyId: string; orderId: string; amount: number; currency: BillingCurrency }
  | { gateway: 'FREE'; checkoutSessionId: string; amount: number; currency: BillingCurrency; status: CheckoutSessionStatus; createdOrgId: string | null; renewOrgId: string | null };

export type PaymentGateway = 'RAZORPAY' | 'STRIPE';
export type CouponDiscountType = 'PERCENT' | 'FIXED';

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  percentOff: number | null;
  fixedOffInrPaise: number | null;
  fixedOffUsdCents: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminOverview {
  organizations: { total: number; active: number; suspended: number; newThisMonth: number };
  users: { total: number };
  subscriptions: { active: number; expired: number };
  revenue: { currency: BillingCurrency; totalAmount: number; paymentCount: number }[];
  coupons: { totalRedemptions: number };
}

export interface AdminOrgRow {
  id: string;
  name: string;
  slug: string;
  status: OrgStatus;
  createdAt: string;
  memberCount: number;
  projectCount: number;
  plan: { id: string; name: string } | null;
  subscriptionActive: boolean;
  currentPeriodEnd: string | null;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  isSuperadmin: boolean;
  createdAt: string;
  orgCount: number;
}

export interface AdminPayment {
  id: string;
  orgId: string;
  subscriptionId: string;
  userId: string;
  gateway: PaymentGateway;
  currency: BillingCurrency;
  amount: number;
  gatewayPaymentId: string;
  createdAt: string;
  org: { id: string; name: string; slug: string };
  user: { id: string; name: string; email: string };
}
