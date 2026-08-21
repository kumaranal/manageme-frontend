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
