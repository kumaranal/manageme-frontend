import { create } from 'zustand';
import { api, ApiError } from '@/lib/api';
import { usePeopleStore, warmPeopleCache, collectPersonIds } from '@/store/peopleStore';
import type {
  Organization, Project, Issue, IssueType, Priority, StoreKind, TaskField, OrgRole, ProjectRole,
  DiscoverableOrg,
} from '@/types';

export interface Toast {
  id: string;
  text: string;
  tone: 'ok' | 'bad';
}

interface DataState {
  orgs: Organization[];
  discoverableOrgs: DiscoverableOrg[];
  toasts: Toast[];
  loading: boolean;
  loaded: boolean;

  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;

  fetchOrgs: () => Promise<void>;
  fetchDiscoverable: () => Promise<void>;
  refreshOrg: (orgId: string) => Promise<void>;
  reset: () => void;

  createOrg: (name: string) => Promise<Organization | undefined>;
  joinDiscoverableOrg: (discoverableOrgId: string) => Promise<string | undefined>;
  toggleOrgSuspend: (orgId: string) => Promise<void>;
  updateOrgCapacity: (orgId: string, hours: number) => Promise<void>;

  inviteMember: (orgId: string, email: string, role: OrgRole) => Promise<void>;
  revokeInvite: (orgId: string, inviteId: string) => Promise<void>;
  updateMemberRole: (orgId: string, userId: string, role: OrgRole) => Promise<void>;
  removeMember: (orgId: string, userId: string) => Promise<void>;
  acceptInvite: (token: string) => Promise<Organization | undefined>;

  createProject: (orgId: string, name: string) => Promise<Project | undefined>;
  toggleArchiveProject: (orgId: string, projectId: string) => Promise<void>;
  addProjectMember: (orgId: string, projectId: string, userId: string) => Promise<void>;
  updateProjectMemberRole: (orgId: string, projectId: string, userId: string, role: ProjectRole) => Promise<void>;
  removeProjectMember: (orgId: string, projectId: string, userId: string) => Promise<void>;
  updateProjectMemberHours: (orgId: string, projectId: string, userId: string, hours: number | null) => Promise<void>;

  renameStatus: (orgId: string, projectId: string, statusId: string, name: string) => Promise<void>;
  moveStatus: (orgId: string, projectId: string, statusId: string, dir: 'up' | 'down') => Promise<void>;
  addStatus: (orgId: string, projectId: string) => Promise<void>;
  deleteStatus: (orgId: string, projectId: string, statusId: string) => Promise<void>;
  updateTaskField: (orgId: string, projectId: string, fieldId: TaskField['id'], patch: Partial<TaskField>) => Promise<void>;
  updateSprintLength: (orgId: string, projectId: string, weeks: number) => Promise<void>;

  createSprint: (orgId: string, projectId: string, name: string, startDate: string, endDate: string) => Promise<void>;
  startSprint: (orgId: string, projectId: string, sprintId: string) => Promise<void>;
  completeSprint: (orgId: string, projectId: string, sprintId: string) => Promise<void>;

  createIssue: (orgId: string, projectId: string, data: {
    title: string; type: IssueType; statusId: string; priority: Priority; assignee: string | null;
    due: string | null; labels: string[]; estimatedHours: number | null; sprintId: string | null;
  }) => Promise<void>;
  updateIssue: (orgId: string, projectId: string, issueId: string, patch: Partial<Issue>, activityText?: string) => Promise<void>;
  moveIssue: (orgId: string, projectId: string, issueId: string, statusId: string, index: number) => Promise<void>;
  addComment: (orgId: string, projectId: string, issueId: string, body: string) => Promise<void>;
  addCc: (orgId: string, projectId: string, issueId: string, userId: string) => Promise<void>;
  removeCc: (orgId: string, projectId: string, issueId: string, userId: string) => Promise<void>;

  createStoreItem: (orgId: string, projectId: string, data: { title: string; kind: StoreKind; content: string }) => Promise<string | undefined>;
  updateStoreItem: (orgId: string, projectId: string, itemId: string, patch: { title?: string; content?: string; kind?: StoreKind }, historyText?: string) => Promise<void>;
  deleteStoreItem: (orgId: string, projectId: string, itemId: string) => Promise<void>;
}

function rid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function findOrg(orgs: Organization[], orgId: string): Organization | undefined {
  return orgs.find((o) => o.id === orgId);
}
function findProject(org: Organization | undefined, projectId: string): Project | undefined {
  return org?.projects.find((p) => p.id === projectId);
}

export const useDataStore = create<DataState>((set, get) => {
  // Every mutation below hits the API then reloads the affected org wholesale —
  // simple and correct, at the cost of an extra round trip per action.
  async function run(action: () => Promise<void>, successText?: string) {
    try {
      await action();
      if (successText) get().toast(successText);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Something went wrong';
      get().toast(message, 'bad');
    }
  }

  return {
    orgs: [],
    discoverableOrgs: [],
    toasts: [],
    loading: false,
    loaded: false,

    toast: (text, tone = 'ok') => {
      const id = rid('t');
      set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
      setTimeout(() => get().dismissToast(id), 2800);
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    fetchOrgs: async () => {
      set({ loading: true });
      try {
        const orgs = await api.get<Organization[]>('/organizations');
        await warmPeopleCache(orgs);
        set({ orgs, loaded: true });
      } finally {
        set({ loading: false });
      }
    },

    fetchDiscoverable: async () => {
      const discoverableOrgs = await api.get<DiscoverableOrg[]>('/organizations/discoverable');
      set({ discoverableOrgs });
    },

    refreshOrg: async (orgId) => {
      const org = await api.get<Organization>(`/organizations/${orgId}`);
      await usePeopleStore.getState().ensure(collectPersonIds(org));
      set((s) => ({ orgs: s.orgs.some((o) => o.id === orgId) ? s.orgs.map((o) => (o.id === orgId ? org : o)) : [...s.orgs, org] }));
    },

    reset: () => set({ orgs: [], discoverableOrgs: [], toasts: [], loaded: false }),

    createOrg: async (name) => {
      let created: Organization | undefined;
      await run(async () => {
        created = await api.post<Organization>('/organizations', { name });
        await usePeopleStore.getState().ensure(collectPersonIds(created));
        set((s) => ({ orgs: [...s.orgs, created!] }));
      }, `${name} created · you are its org admin`);
      return created;
    },

    joinDiscoverableOrg: async (discoverableOrgId) => {
      const found = get().discoverableOrgs.find((o) => o.id === discoverableOrgId);
      if (!found) return undefined;
      await run(async () => {
        const org = await api.post<Organization>(`/organizations/${discoverableOrgId}/join`);
        await usePeopleStore.getState().ensure(collectPersonIds(org));
        set((s) => ({
          orgs: [...s.orgs, org],
          discoverableOrgs: s.discoverableOrgs.filter((o) => o.id !== discoverableOrgId),
        }));
      }, `Joined ${found.name} as a member`);
      return found.id;
    },

    toggleOrgSuspend: async (orgId) => {
      const org = findOrg(get().orgs, orgId);
      const willSuspend = org?.status !== 'SUSPENDED';
      await run(async () => {
        await api.patch(`/organizations/${orgId}/suspend`);
        await get().refreshOrg(orgId);
      }, org ? (willSuspend ? `${org.name} suspended` : `${org.name} reinstated`) : undefined);
    },

    updateOrgCapacity: async (orgId, hours) => {
      await run(async () => {
        await api.patch(`/organizations/${orgId}/capacity`, { hours: Math.max(1, hours) });
        await get().refreshOrg(orgId);
      });
    },

    inviteMember: async (orgId, email, role) => {
      await run(async () => {
        await api.post(`/organizations/${orgId}/invites`, { email, role });
        await get().refreshOrg(orgId);
      }, `Invitation sent to ${email}`);
    },

    revokeInvite: async (orgId, inviteId) => {
      const email = findOrg(get().orgs, orgId)?.invites.find((i) => i.id === inviteId)?.email ?? '';
      await run(async () => {
        await api.delete(`/organizations/${orgId}/invites/${inviteId}`);
        await get().refreshOrg(orgId);
      }, `Invitation to ${email} revoked`);
    },

    updateMemberRole: async (orgId, userId, role) => {
      await run(async () => {
        await api.patch(`/organizations/${orgId}/members/${userId}`, { role });
        await get().refreshOrg(orgId);
      });
    },

    removeMember: async (orgId, userId) => {
      await run(async () => {
        await api.delete(`/organizations/${orgId}/members/${userId}`);
        await get().refreshOrg(orgId);
      });
    },

    acceptInvite: async (token) => {
      let org: Organization | undefined;
      await run(async () => {
        org = await api.post<Organization>(`/invites/${token}/accept`);
        await usePeopleStore.getState().ensure(collectPersonIds(org));
        set((s) => ({ orgs: s.orgs.some((o) => o.id === org!.id) ? s.orgs.map((o) => (o.id === org!.id ? org! : o)) : [...s.orgs, org!] }));
      }, `Membership confirmed in ${org?.name ?? 'the organization'}`);
      return org;
    },

    createProject: async (orgId, name) => {
      let created: Project | undefined;
      await run(async () => {
        await api.post(`/organizations/${orgId}/projects`, { name });
        await get().refreshOrg(orgId);
        created = findOrg(get().orgs, orgId)?.projects.find((p) => p.name === name);
      }, `${name} created · you are its lead`);
      return created;
    },

    toggleArchiveProject: async (orgId, projectId) => {
      const project = findProject(findOrg(get().orgs, orgId), projectId);
      const willArchive = !project?.archived;
      await run(async () => {
        await api.patch(`/organizations/${orgId}/projects/${projectId}/archive`);
        await get().refreshOrg(orgId);
      }, project ? (willArchive ? `${project.name} archived` : `${project.name} unarchived`) : undefined);
    },

    addProjectMember: async (orgId, projectId, userId) => {
      await run(async () => {
        await api.post(`/organizations/${orgId}/projects/${projectId}/members`, { userId });
        await get().refreshOrg(orgId);
      });
    },
    updateProjectMemberRole: async (orgId, projectId, userId, role) => {
      await run(async () => {
        await api.patch(`/organizations/${orgId}/projects/${projectId}/members/${userId}/role`, { role });
        await get().refreshOrg(orgId);
      });
    },
    removeProjectMember: async (orgId, projectId, userId) => {
      await run(async () => {
        await api.delete(`/organizations/${orgId}/projects/${projectId}/members/${userId}`);
        await get().refreshOrg(orgId);
      });
    },
    updateProjectMemberHours: async (orgId, projectId, userId, hours) => {
      await run(async () => {
        await api.patch(`/organizations/${orgId}/projects/${projectId}/members/${userId}/hours`, { hours });
        await get().refreshOrg(orgId);
      });
    },

    renameStatus: async (orgId, projectId, statusId, name) => {
      await run(async () => {
        await api.patch(`/organizations/${orgId}/projects/${projectId}/statuses/${statusId}/rename`, { name });
        await get().refreshOrg(orgId);
      });
    },
    moveStatus: async (orgId, projectId, statusId, dir) => {
      await run(async () => {
        await api.patch(`/organizations/${orgId}/projects/${projectId}/statuses/${statusId}/move`, { direction: dir });
        await get().refreshOrg(orgId);
      });
    },
    addStatus: async (orgId, projectId) => {
      await run(async () => {
        await api.post(`/organizations/${orgId}/projects/${projectId}/statuses`);
        await get().refreshOrg(orgId);
      }, 'Column added');
    },
    deleteStatus: async (orgId, projectId, statusId) => {
      await run(async () => {
        await api.delete(`/organizations/${orgId}/projects/${projectId}/statuses/${statusId}`);
        await get().refreshOrg(orgId);
      });
    },
    updateTaskField: async (orgId, projectId, fieldId, patch) => {
      await run(async () => {
        await api.patch(`/organizations/${orgId}/projects/${projectId}/task-fields/${fieldId}`, patch);
        await get().refreshOrg(orgId);
      });
    },
    updateSprintLength: async (orgId, projectId, weeks) => {
      await run(async () => {
        await api.patch(`/organizations/${orgId}/projects/${projectId}/sprint-config`, { weeks });
        await get().refreshOrg(orgId);
      });
    },

    createSprint: async (orgId, projectId, name, startDate, endDate) => {
      await run(async () => {
        await api.post(`/organizations/${orgId}/projects/${projectId}/sprints`, { name, startDate, endDate });
        await get().refreshOrg(orgId);
      }, `${name} created`);
    },
    startSprint: async (orgId, projectId, sprintId) => {
      const name = findProject(findOrg(get().orgs, orgId), projectId)?.sprints.find((s) => s.id === sprintId)?.name;
      await run(async () => {
        await api.patch(`/organizations/${orgId}/projects/${projectId}/sprints/${sprintId}/start`);
        await get().refreshOrg(orgId);
      }, name ? `${name} started` : undefined);
    },
    completeSprint: async (orgId, projectId, sprintId) => {
      const name = findProject(findOrg(get().orgs, orgId), projectId)?.sprints.find((s) => s.id === sprintId)?.name;
      await run(async () => {
        await api.patch(`/organizations/${orgId}/projects/${projectId}/sprints/${sprintId}/complete`);
        await get().refreshOrg(orgId);
      }, name ? `${name} completed` : undefined);
    },

    createIssue: async (orgId, projectId, data) => {
      await run(async () => {
        await api.post(`/organizations/${orgId}/projects/${projectId}/issues`, data);
        await get().refreshOrg(orgId);
      }, `${data.title.slice(0, 40)} created`);
    },

    updateIssue: async (orgId, projectId, issueId, patch, activityText) => {
      await run(async () => {
        await api.patch(`/organizations/${orgId}/projects/${projectId}/issues/${issueId}`, { ...patch, activityText });
        await get().refreshOrg(orgId);
      });
    },

    moveIssue: async (orgId, projectId, issueId, statusId, index) => {
      const project = findProject(findOrg(get().orgs, orgId), projectId);
      const issue = project?.issues.find((i) => i.id === issueId);
      const statusName = project?.statuses.find((s) => s.id === statusId)?.name ?? '';
      const key = project && issue ? `${project.key}-${issue.number}` : '';
      await run(async () => {
        await api.patch(`/organizations/${orgId}/projects/${projectId}/issues/${issueId}/move`, { statusId, index });
        await get().refreshOrg(orgId);
      }, key ? `${key} → ${statusName}` : undefined);
    },

    addComment: async (orgId, projectId, issueId, body) => {
      await run(async () => {
        await api.post(`/organizations/${orgId}/projects/${projectId}/issues/${issueId}/comments`, { body });
        await get().refreshOrg(orgId);
      });
    },
    addCc: async (orgId, projectId, issueId, userId) => {
      await run(async () => {
        await api.put(`/organizations/${orgId}/projects/${projectId}/issues/${issueId}/cc/${userId}`);
        await get().refreshOrg(orgId);
      });
    },
    removeCc: async (orgId, projectId, issueId, userId) => {
      await run(async () => {
        await api.delete(`/organizations/${orgId}/projects/${projectId}/issues/${issueId}/cc/${userId}`);
        await get().refreshOrg(orgId);
      });
    },

    createStoreItem: async (orgId, projectId, data) => {
      let id: string | undefined;
      await run(async () => {
        const item = await api.post<{ id: string }>(`/organizations/${orgId}/projects/${projectId}/store`, data);
        id = item.id;
        await get().refreshOrg(orgId);
      }, `${data.title} added to the store`);
      return id;
    },
    updateStoreItem: async (orgId, projectId, itemId, patch, historyText) => {
      await run(async () => {
        await api.patch(`/organizations/${orgId}/projects/${projectId}/store/${itemId}`, { ...patch, historyText });
        await get().refreshOrg(orgId);
      });
    },
    deleteStoreItem: async (orgId, projectId, itemId) => {
      await run(async () => {
        await api.delete(`/organizations/${orgId}/projects/${projectId}/store/${itemId}`);
        await get().refreshOrg(orgId);
      });
    },
  };
});

export function nextSprintDefaults(lengthWeeks: number, existingCount: number) {
  const today = new Date().toISOString().slice(0, 10);
  const end = new Date(today + 'T00:00:00');
  end.setDate(end.getDate() + lengthWeeks * 7);
  return { name: `Sprint ${existingCount + 1}`, start: today, end: end.toISOString().slice(0, 10) };
}
