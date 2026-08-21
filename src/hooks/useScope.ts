import { useParams } from 'react-router-dom';
import { useDataStore } from '@/store/dataStore';
import { useAuthStore } from '@/store/authStore';
import { orgRole, projectRole, canEditProject, isProjectManager } from '@/lib/permissions';

export function useOrg() {
  const { orgSlug } = useParams();
  return useDataStore((s) => s.orgs.find((o) => o.slug === orgSlug) ?? null);
}

export function useProject() {
  const org = useOrg();
  const { projectKey } = useParams();
  return org?.projects.find((p) => p.key === projectKey) ?? null;
}

export function useMe() {
  return useAuthStore((s) => s.userId);
}

export function usePermissions() {
  const org = useOrg();
  const project = useProject();
  const me = useMe();
  if (!org) {
    return {
      org, project, me,
      myOrgRole: null, myProjectRole: null, canEdit: false, isManager: false, isOrgAdmin: false,
    };
  }
  return {
    org,
    project,
    me,
    myOrgRole: orgRole(org, me),
    myProjectRole: project ? projectRole(project, me, org) : null,
    canEdit: canEditProject(org, project, me),
    isManager: isProjectManager(org, project, me),
    isOrgAdmin: orgRole(org, me) === 'ORG_ADMIN',
  };
}
