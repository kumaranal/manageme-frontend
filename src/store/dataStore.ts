import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import { seedOrgs, seedDiscoverableOrgs } from '@/data/seed';
import { CURRENT_USER_ID } from '@/data/people';
import { deriveProjectKey, slugify, addDaysIso, todayIso } from '@/lib/format';
import type {
  Organization, Project, Issue, IssueType, Priority, StoreKind, TaskField, OrgRole, ProjectRole,
} from '@/types';

export interface Toast {
  id: string;
  text: string;
  tone: 'ok' | 'bad';
}

// This store is the seam to swap for a real API: every action below mutates
// local state directly, but each is already shaped as the request a NestJS
// endpoint would serve (org/project scoped, single responsibility per call).

interface DataState {
  orgs: Organization[];
  discoverableOrgs: { id: string; name: string; slug: string; initial: string }[];
  toasts: Toast[];

  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;

  createOrg: (name: string) => string;
  joinDiscoverableOrg: (discoverableOrgId: string) => string | undefined;
  toggleOrgSuspend: (orgId: string) => void;
  updateOrgCapacity: (orgId: string, hours: number) => void;

  inviteMember: (orgId: string, email: string, role: OrgRole) => void;
  revokeInvite: (orgId: string, inviteId: string) => void;
  updateMemberRole: (orgId: string, userId: string, role: OrgRole) => void;
  removeMember: (orgId: string, userId: string) => void;

  createProject: (orgId: string, name: string) => string;
  toggleArchiveProject: (orgId: string, projectId: string) => void;
  addProjectMember: (orgId: string, projectId: string, userId: string) => void;
  updateProjectMemberRole: (orgId: string, projectId: string, userId: string, role: ProjectRole) => void;
  removeProjectMember: (orgId: string, projectId: string, userId: string) => void;
  updateProjectMemberHours: (orgId: string, projectId: string, userId: string, hours: number | null) => void;

  renameStatus: (orgId: string, projectId: string, statusId: string, name: string) => void;
  moveStatus: (orgId: string, projectId: string, statusId: string, dir: 'up' | 'down') => void;
  addStatus: (orgId: string, projectId: string) => void;
  deleteStatus: (orgId: string, projectId: string, statusId: string) => void;
  updateTaskField: (orgId: string, projectId: string, fieldId: TaskField['id'], patch: Partial<TaskField>) => void;
  updateSprintLength: (orgId: string, projectId: string, weeks: number) => void;

  createSprint: (orgId: string, projectId: string, name: string, startDate: string, endDate: string) => void;
  startSprint: (orgId: string, projectId: string, sprintId: string) => void;
  completeSprint: (orgId: string, projectId: string, sprintId: string) => void;

  createIssue: (orgId: string, projectId: string, data: {
    title: string; type: IssueType; statusId: string; priority: Priority; assignee: string | null;
    due: string | null; labels: string[]; estimatedHours: number | null; sprintId: string | null;
  }) => void;
  updateIssue: (orgId: string, projectId: string, issueId: string, patch: Partial<Issue>, activityText?: string) => void;
  moveIssue: (orgId: string, projectId: string, issueId: string, statusId: string, index: number) => void;
  addComment: (orgId: string, projectId: string, issueId: string, body: string) => void;
  addCc: (orgId: string, projectId: string, issueId: string, userId: string) => void;
  removeCc: (orgId: string, projectId: string, issueId: string, userId: string) => void;

  createStoreItem: (orgId: string, projectId: string, data: { title: string; kind: StoreKind; content: string }) => string;
  updateStoreItem: (orgId: string, projectId: string, itemId: string, patch: { title?: string; content?: string; kind?: StoreKind }, historyText?: string) => void;
  deleteStoreItem: (orgId: string, projectId: string, itemId: string) => void;
}

function findOrg(orgs: Organization[], orgId: string): Organization {
  const org = orgs.find((o) => o.id === orgId);
  if (!org) throw new Error(`Unknown org ${orgId}`);
  return org;
}
function findProject(org: Organization, projectId: string): Project {
  const project = org.projects.find((p) => p.id === projectId);
  if (!project) throw new Error(`Unknown project ${projectId}`);
  return project;
}
function findIssue(project: Project, issueId: string): Issue {
  const issue = project.issues.find((i) => i.id === issueId);
  if (!issue) throw new Error(`Unknown issue ${issueId}`);
  return issue;
}
function rid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
  orgs: seedOrgs(),
  discoverableOrgs: seedDiscoverableOrgs(),
  toasts: [],

  toast: (text, tone = 'ok') => {
    const id = rid('t');
    set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
    setTimeout(() => get().dismissToast(id), 2800);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  createOrg: (name) => {
    const id = rid('org');
    set(produce((s: DataState) => {
      s.orgs.push({
        id, name, slug: slugify(name) || id, initial: name.trim()[0]?.toUpperCase() ?? '?',
        status: 'ACTIVE', capacityHoursPerWeek: 40,
        members: [{ userId: CURRENT_USER_ID, role: 'ORG_ADMIN' }], invites: [], projects: [],
      });
    }));
    get().toast(`${name} created · you are its org admin`);
    return id;
  },

  joinDiscoverableOrg: (discoverableOrgId) => {
    const found = get().discoverableOrgs.find((o) => o.id === discoverableOrgId);
    if (!found) return undefined;
    set(produce((s: DataState) => {
      s.discoverableOrgs = s.discoverableOrgs.filter((o) => o.id !== discoverableOrgId);
      s.orgs.push({
        id: found.id, name: found.name, slug: found.slug, initial: found.initial,
        status: 'ACTIVE', capacityHoursPerWeek: 40,
        members: [{ userId: CURRENT_USER_ID, role: 'MEMBER' }], invites: [], projects: [],
      });
    }));
    get().toast(`Joined ${found.name} as a member`);
    return found.id;
  },

  toggleOrgSuspend: (orgId) => {
    let label = '';
    set(produce((s: DataState) => {
      const org = findOrg(s.orgs, orgId);
      org.status = org.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      label = org.status === 'SUSPENDED' ? `${org.name} suspended` : `${org.name} reinstated`;
    }));
    get().toast(label);
  },

  updateOrgCapacity: (orgId, hours) => set(produce((s: DataState) => {
    findOrg(s.orgs, orgId).capacityHoursPerWeek = Math.max(1, hours);
  })),

  inviteMember: (orgId, email, role) => {
    set(produce((s: DataState) => {
      findOrg(s.orgs, orgId).invites.push({ id: rid('inv'), email, role, at: 'sent just now', token: rid('inv') });
    }));
    get().toast(`Invitation sent to ${email} · link copied`);
  },
  revokeInvite: (orgId, inviteId) => {
    let email = '';
    set(produce((s: DataState) => {
      const org = findOrg(s.orgs, orgId);
      email = org.invites.find((i) => i.id === inviteId)?.email ?? '';
      org.invites = org.invites.filter((i) => i.id !== inviteId);
    }));
    get().toast(`Invitation to ${email} revoked`);
  },
  updateMemberRole: (orgId, userId, role) => {
    set(produce((s: DataState) => {
      const org = findOrg(s.orgs, orgId);
      const m = org.members.find((x) => x.userId === userId);
      if (m) m.role = role;
    }));
  },
  removeMember: (orgId, userId) => {
    set(produce((s: DataState) => {
      const org = findOrg(s.orgs, orgId);
      org.members = org.members.filter((m) => m.userId !== userId);
      org.projects.forEach((p) => { p.members = p.members.filter((m) => m.userId !== userId); });
    }));
  },

  createProject: (orgId, name) => {
    const id = rid('p');
    set(produce((s: DataState) => {
      const org = findOrg(s.orgs, orgId);
      const key = deriveProjectKey(name, org.projects.map((p) => p.key));
      org.projects.push({
        id, key, name, lead: CURRENT_USER_ID, counter: 0, archived: false,
        blurb: 'A fresh project — nothing here yet.',
        taskFields: [
          { id: 'priority', label: 'Priority', enabled: true, required: false },
          { id: 'assignee', label: 'Assignee', enabled: true, required: false },
          { id: 'dueDate', label: 'Due date', enabled: true, required: false },
          { id: 'labels', label: 'Labels', enabled: false, required: false },
          { id: 'estimatedHours', label: 'Estimated hours', enabled: true, required: false },
        ],
        sprints: [], sprintConfig: { lengthWeeks: 2 }, store: [],
        members: [{ userId: CURRENT_USER_ID, role: 'LEAD' }],
        statuses: [
          { id: rid('st'), name: 'To Do', category: 'TODO' },
          { id: rid('st'), name: 'In Progress', category: 'IN_PROGRESS' },
          { id: rid('st'), name: 'Done', category: 'DONE' },
        ],
        issues: [],
      });
    }));
    get().toast(`${name} created · you are its lead`);
    return id;
  },

  toggleArchiveProject: (orgId, projectId) => {
    let label = '';
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      project.archived = !project.archived;
      label = project.archived ? `${project.name} archived` : `${project.name} unarchived`;
    }));
    get().toast(label);
  },

  addProjectMember: (orgId, projectId, userId) => {
    set(produce((s: DataState) => {
      findProject(findOrg(s.orgs, orgId), projectId).members.push({ userId, role: 'CONTRIBUTOR' });
    }));
  },
  updateProjectMemberRole: (orgId, projectId, userId, role) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      const m = project.members.find((x) => x.userId === userId);
      if (m) m.role = role;
    }));
  },
  removeProjectMember: (orgId, projectId, userId) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      project.members = project.members.filter((m) => m.userId !== userId);
    }));
  },
  updateProjectMemberHours: (orgId, projectId, userId, hours) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      const m = project.members.find((x) => x.userId === userId);
      if (m) m.weeklyHours = hours;
    }));
  },

  renameStatus: (orgId, projectId, statusId, name) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      const st = project.statuses.find((x) => x.id === statusId);
      if (st) st.name = name;
    }));
  },
  moveStatus: (orgId, projectId, statusId, dir) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      const idx = project.statuses.findIndex((x) => x.id === statusId);
      const swapWith = dir === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || swapWith < 0 || swapWith >= project.statuses.length) return;
      const tmp = project.statuses[idx];
      project.statuses[idx] = project.statuses[swapWith];
      project.statuses[swapWith] = tmp;
    }));
  },
  addStatus: (orgId, projectId) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      project.statuses.splice(project.statuses.length - 1, 0, { id: rid('st'), name: 'New column', category: 'IN_PROGRESS' });
    }));
    get().toast('Column added');
  },
  deleteStatus: (orgId, projectId, statusId) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      if (project.issues.some((i) => i.statusId === statusId)) return;
      project.statuses = project.statuses.filter((x) => x.id !== statusId);
    }));
  },
  updateTaskField: (orgId, projectId, fieldId, patch) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      const f = project.taskFields.find((x) => x.id === fieldId);
      if (!f) return;
      Object.assign(f, patch);
      if (!f.enabled) f.required = false;
    }));
  },
  updateSprintLength: (orgId, projectId, weeks) => {
    set(produce((s: DataState) => {
      findProject(findOrg(s.orgs, orgId), projectId).sprintConfig.lengthWeeks = weeks;
    }));
  },

  createSprint: (orgId, projectId, name, startDate, endDate) => {
    set(produce((s: DataState) => {
      findProject(findOrg(s.orgs, orgId), projectId).sprints.push({ id: rid('spr'), name, startDate, endDate, status: 'PLANNED' });
    }));
    get().toast(`${name} created`);
  },
  startSprint: (orgId, projectId, sprintId) => {
    let name = '';
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      project.sprints.forEach((sp) => { if (sp.status === 'ACTIVE') sp.status = 'PLANNED'; });
      const sp = project.sprints.find((x) => x.id === sprintId);
      if (sp) { sp.status = 'ACTIVE'; name = sp.name; }
    }));
    get().toast(`${name} started`);
  },
  completeSprint: (orgId, projectId, sprintId) => {
    let name = '';
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      const sp = project.sprints.find((x) => x.id === sprintId);
      if (sp) { sp.status = 'CLOSED'; name = sp.name; }
    }));
    get().toast(`${name} completed`);
  },

  createIssue: (orgId, projectId, data) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      const colRanks = project.issues.filter((i) => i.statusId === data.statusId).map((i) => i.rank);
      const rank = colRanks.length ? Math.max(...colRanks) + 1000 : 1000;
      project.counter += 1;
      const sprint = data.sprintId ? project.sprints.find((sp) => sp.id === data.sprintId) : undefined;
      project.issues.push({
        id: rid('i'), number: project.counter, title: data.title, type: data.type, priority: data.priority,
        assignee: data.assignee, statusId: data.statusId, rank, due: sprint ? sprint.endDate : data.due,
        labels: data.labels, cc: [], comments: [], estimatedHours: data.estimatedHours,
        sprintId: data.sprintId, activity: [{ id: rid('a'), actor: CURRENT_USER_ID, text: 'created this issue', at: 'just now' }],
      });
    }));
    get().toast(`${data.title.slice(0, 40)} created`);
  },

  updateIssue: (orgId, projectId, issueId, patch, activityText) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      const issue = findIssue(project, issueId);
      Object.assign(issue, patch);
      if (patch.sprintId !== undefined) {
        const sprint = patch.sprintId ? project.sprints.find((sp) => sp.id === patch.sprintId) : undefined;
        issue.due = sprint ? sprint.endDate : issue.due;
      }
      if (activityText) issue.activity.unshift({ id: rid('a'), actor: CURRENT_USER_ID, text: activityText, at: 'just now' });
    }));
  },

  moveIssue: (orgId, projectId, issueId, statusId, index) => {
    let key = '';
    let statusName = '';
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      const issue = findIssue(project, issueId);
      const col = project.issues.filter((i) => i.statusId === statusId && i.id !== issueId).sort((a, b) => a.rank - b.rank);
      const prev = col[index - 1];
      const next = col[index];
      const lo = prev ? prev.rank : 0;
      const hi = next ? next.rank : col.length ? col[col.length - 1].rank + 2000 : 2000;
      issue.rank = prev || next ? (lo + hi) / 2 : 1000;
      const from = project.statuses.find((st) => st.id === issue.statusId);
      const to = project.statuses.find((st) => st.id === statusId);
      if (issue.statusId !== statusId && from && to) {
        issue.activity.unshift({ id: rid('a'), actor: CURRENT_USER_ID, text: `moved ${from.name} → ${to.name}`, at: 'just now' });
      }
      issue.statusId = statusId;
      key = `${project.key}-${issue.number}`;
      statusName = to?.name ?? '';
    }));
    get().toast(`${key} → ${statusName}`);
  },

  addComment: (orgId, projectId, issueId, body) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      const issue = findIssue(project, issueId);
      issue.comments.push({ id: rid('c'), author: CURRENT_USER_ID, body, at: 'just now' });
      issue.activity.unshift({ id: rid('a'), actor: CURRENT_USER_ID, text: 'commented', at: 'just now' });
    }));
  },
  addCc: (orgId, projectId, issueId, userId) => {
    set(produce((s: DataState) => {
      const issue = findIssue(findProject(findOrg(s.orgs, orgId), projectId), issueId);
      if (!issue.cc.includes(userId)) issue.cc.push(userId);
    }));
  },
  removeCc: (orgId, projectId, issueId, userId) => {
    set(produce((s: DataState) => {
      const issue = findIssue(findProject(findOrg(s.orgs, orgId), projectId), issueId);
      issue.cc = issue.cc.filter((id) => id !== userId);
    }));
  },

  createStoreItem: (orgId, projectId, data) => {
    const id = rid('st');
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      project.store.unshift({
        id, title: data.title, kind: data.kind, content: data.content, updatedBy: CURRENT_USER_ID, updatedAt: 'just now',
        history: [{ actor: CURRENT_USER_ID, text: 'created this item', at: 'just now' }],
      });
    }));
    get().toast(`${data.title} added to the store`);
    return id;
  },
  updateStoreItem: (orgId, projectId, itemId, patch, historyText) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      const item = project.store.find((x) => x.id === itemId);
      if (!item) return;
      Object.assign(item, patch);
      item.updatedBy = CURRENT_USER_ID;
      item.updatedAt = 'just now';
      if (historyText) item.history.unshift({ actor: CURRENT_USER_ID, text: historyText, at: 'just now' });
    }));
  },
  deleteStoreItem: (orgId, projectId, itemId) => {
    set(produce((s: DataState) => {
      const project = findProject(findOrg(s.orgs, orgId), projectId);
      project.store = project.store.filter((x) => x.id !== itemId);
    }));
  },
    }),
    {
      name: 'manage-me-data',
      version: 1,
      partialize: (s) => ({ orgs: s.orgs, discoverableOrgs: s.discoverableOrgs }),
    },
  ),
);

export function nextSprintDefaults(lengthWeeks: number, existingCount: number) {
  const start = todayIso();
  const end = addDaysIso(start, lengthWeeks * 7);
  return { name: `Sprint ${existingCount + 1}`, start, end };
}
