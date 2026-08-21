import type { Organization, Project, OrgRole, ProjectRole } from '@/types';

export function orgRole(org: Organization, userId: string): OrgRole | null {
  return org.members.find((m) => m.userId === userId)?.role ?? null;
}

export function projectRole(project: Project, userId: string, org: Organization): ProjectRole | null {
  if (orgRole(org, userId) === 'ORG_ADMIN') return 'LEAD';
  return project.members.find((m) => m.userId === userId)?.role ?? null;
}

export function isOrgAdmin(org: Organization, userId: string): boolean {
  return orgRole(org, userId) === 'ORG_ADMIN';
}

export function canEditProject(org: Organization, project: Project | null | undefined, userId: string): boolean {
  if (!project) return false;
  if (isOrgAdmin(org, userId)) return true;
  const role = project.members.find((m) => m.userId === userId)?.role;
  return role === 'LEAD' || role === 'CONTRIBUTOR';
}

export function isProjectManager(org: Organization, project: Project | null | undefined, userId: string): boolean {
  if (!project) return false;
  if (isOrgAdmin(org, userId)) return true;
  return project.members.find((m) => m.userId === userId)?.role === 'LEAD';
}

export function canArchiveProject(org: Organization, project: Project | null | undefined, userId: string): boolean {
  return isProjectManager(org, project, userId);
}
