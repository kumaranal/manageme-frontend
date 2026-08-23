import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';

import Login from '@/pages/auth/Login';

const Signup = lazy(() => import('@/pages/auth/Signup'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const InviteAccept = lazy(() => import('@/pages/auth/InviteAccept'));
const OrgPicker = lazy(() => import('@/pages/auth/OrgPicker'));
const NewOrg = lazy(() => import('@/pages/auth/NewOrg'));
const JoinOrg = lazy(() => import('@/pages/auth/JoinOrg'));
const CheckoutSuccess = lazy(() => import('@/pages/auth/CheckoutSuccess'));
const CheckoutCancel = lazy(() => import('@/pages/auth/CheckoutCancel'));

import { AppLayout } from '@/layout/AppLayout';
const MyWork = lazy(() => import('@/pages/MyWork'));
const Projects = lazy(() => import('@/pages/Projects'));
const Members = lazy(() => import('@/pages/Members'));
const OrgWorkload = lazy(() => import('@/pages/OrgWorkload'));

import { AdminLayout } from '@/layout/AdminLayout';
const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'));
const AdminOrganizations = lazy(() => import('@/pages/admin/AdminOrganizations'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminPlans = lazy(() => import('@/pages/admin/AdminPlans'));
const AdminCoupons = lazy(() => import('@/pages/admin/AdminCoupons'));
const AdminPayments = lazy(() => import('@/pages/admin/AdminPayments'));

const Board = lazy(() => import('@/pages/project/Board'));
const Backlog = lazy(() => import('@/pages/project/Backlog'));
const Sprints = lazy(() => import('@/pages/project/Sprints'));
const Store = lazy(() => import('@/pages/project/Store'));
const ProjectWorkload = lazy(() => import('@/pages/project/ProjectWorkload'));
const Settings = lazy(() => import('@/pages/project/Settings'));

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const status = useAuthStore((s) => s.status);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSuperadmin = useAuthStore((s) => s.profile?.isSuperadmin);
  const init = useAuthStore((s) => s.init);
  const fetchOrgs = useDataStore((s) => s.fetchOrgs);
  const fetchDiscoverable = useDataStore((s) => s.fetchDiscoverable);
  const resetData = useDataStore((s) => s.reset);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrgs();
      fetchDiscoverable();
    } else {
      resetData();
    }
  }, [isAuthenticated, fetchOrgs, fetchDiscoverable, resetData]);

  if (status === 'loading') {
    return <div className="h-screen w-full flex items-center justify-center bg-canvas text-neutral-600">Loading…</div>;
  }

  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-canvas text-neutral-600">Loading…</div>}>
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? (isSuperadmin ? '/admin' : '/orgs') : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/orgs" element={<RequireAuth><OrgPicker /></RequireAuth>} />
      <Route path="/orgs/new" element={<RequireAuth><NewOrg /></RequireAuth>} />
      <Route path="/orgs/join" element={<RequireAuth><JoinOrg /></RequireAuth>} />
      <Route path="/checkout/success" element={<RequireAuth><CheckoutSuccess /></RequireAuth>} />
      <Route path="/checkout/cancel" element={<RequireAuth><CheckoutCancel /></RequireAuth>} />
      <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<AdminOverview />} />
        <Route path="organizations" element={<AdminOrganizations />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="payments" element={<AdminPayments />} />
      </Route>

      <Route path="/o/:orgSlug" element={<AppLayout />}>
        <Route index element={<Navigate to="my-work" replace />} />
        <Route path="my-work" element={<MyWork />} />
        <Route path="projects" element={<Projects />} />
        <Route path="members" element={<Members />} />
        <Route path="workload" element={<OrgWorkload />} />
        <Route path="p/:projectKey">
          <Route index element={<Navigate to="board" replace />} />
          <Route path="board" element={<Board />} />
          <Route path="backlog" element={<Backlog />} />
          <Route path="sprints" element={<Sprints />} />
          <Route path="store" element={<Store />} />
          <Route path="workload" element={<ProjectWorkload />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
