import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import InviteAccept from '@/pages/auth/InviteAccept';
import OrgPicker from '@/pages/auth/OrgPicker';
import NewOrg from '@/pages/auth/NewOrg';
import JoinOrg from '@/pages/auth/JoinOrg';

import { AppLayout } from '@/layout/AppLayout';
import MyWork from '@/pages/MyWork';
import Projects from '@/pages/Projects';
import Members from '@/pages/Members';
import OrgWorkload from '@/pages/OrgWorkload';
import Superadmin from '@/pages/Superadmin';

import Board from '@/pages/project/Board';
import Backlog from '@/pages/project/Backlog';
import Sprints from '@/pages/project/Sprints';
import Store from '@/pages/project/Store';
import ProjectWorkload from '@/pages/project/ProjectWorkload';
import Settings from '@/pages/project/Settings';

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/orgs' : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/orgs" element={<RequireAuth><OrgPicker /></RequireAuth>} />
      <Route path="/orgs/new" element={<RequireAuth><NewOrg /></RequireAuth>} />
      <Route path="/orgs/join" element={<RequireAuth><JoinOrg /></RequireAuth>} />
      <Route path="/admin" element={<RequireAuth><Superadmin /></RequireAuth>} />

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
  );
}
