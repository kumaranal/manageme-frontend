import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { useOrg } from '@/hooks/useScope';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Toaster } from '@/components/ui/Toaster';
import { IssueDetailDrawer } from '@/components/IssueDetailDrawer';
import { CreateIssueModal } from '@/components/CreateIssueModal';
import { InviteModal } from '@/components/InviteModal';
import { NewProjectModal } from '@/components/NewProjectModal';
import { NewSprintModal } from '@/components/NewSprintModal';
import { StoreItemCreateModal } from '@/components/StoreItemModal';
import { StoreItemDrawer } from '@/components/StoreItemDrawer';

export function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSuperadmin = useAuthStore((s) => s.profile?.isSuperadmin);
  const orgsLoaded = useDataStore((s) => s.loaded);
  const org = useOrg();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Org data loads async after auth resolves — don't redirect away from a
  // deep link (hard refresh, bookmark) before the first fetch has landed.
  if (!orgsLoaded) return null;
  if (!org) return <Navigate to="/orgs" replace />;
  if (org.status === 'SUSPENDED' && !isSuperadmin) return <Navigate to="/orgs" replace />;

  return (
    <div className="h-screen w-full flex bg-canvas overflow-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <div className="flex-1 min-w-0 overflow-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <Outlet />
        </div>
      </div>

      <Toaster />
      <IssueDetailDrawer />
      <StoreItemDrawer />
      <CreateIssueModal />
      <InviteModal />
      <NewProjectModal />
      <NewSprintModal />
      <StoreItemCreateModal />
    </div>
  );
}
