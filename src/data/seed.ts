import type { Comment, ActivityEntry, Issue, IssueType, Organization, Priority, DiscoverableOrg, Project, TaskField } from '@/types';

let uid = 0;
const nextId = (prefix: string) => `${prefix}_${(++uid).toString(36)}`;

function comment(author: string, body: string, at: string): Comment {
  return { id: nextId('c'), author, body, at };
}

function activity(actor: string, text: string, at: string): ActivityEntry {
  return { id: nextId('a'), actor, text, at };
}

interface IssueSeed {
  labels?: string[];
  due?: string | null;
  sprintId?: string;
  cc?: string[];
  comments?: Comment[];
  activity?: ActivityEntry[];
}

function iss(
  projectKey: string,
  n: number,
  title: string,
  type: IssueType,
  priority: Priority,
  assignee: string | null,
  statusId: string,
  rank: number,
  extra?: IssueSeed,
): Issue {
  const baseHrs = type === 'Bug' ? 3 : type === 'Story' ? 8 : 5;
  return {
    id: `i_${projectKey.toLowerCase()}_${n}`,
    number: n,
    title,
    type,
    priority,
    assignee,
    statusId,
    rank,
    due: extra?.due ?? null,
    labels: extra?.labels ?? [],
    cc: extra?.cc ?? [],
    comments: extra?.comments ?? [],
    estimatedHours: baseHrs,
    sprintId: extra?.sprintId,
    activity: extra?.activity ?? [activity('sam', 'created this issue', '4d')],
  };
}

function defaultTaskFields(overrides?: Partial<Record<TaskField['id'], Partial<TaskField>>>): TaskField[] {
  const base: TaskField[] = [
    { id: 'priority', label: 'Priority', enabled: true, required: false },
    { id: 'assignee', label: 'Assignee', enabled: true, required: false },
    { id: 'dueDate', label: 'Due date', enabled: true, required: false },
    { id: 'labels', label: 'Labels', enabled: false, required: false },
    { id: 'estimatedHours', label: 'Estimated hours', enabled: true, required: false },
  ];
  if (!overrides) return base;
  return base.map((f) => (overrides[f.id] ? { ...f, ...overrides[f.id] } : f));
}

function webProject(): Project {
  return {
    id: 'p_web', key: 'WEB', name: 'Web App', lead: 'dana', counter: 12,
    taskFields: defaultTaskFields(),
    sprints: [
      { id: 'spr_w1', name: 'Sprint 12', startDate: '2026-08-10', endDate: '2026-08-24', status: 'ACTIVE' },
      { id: 'spr_w2', name: 'Sprint 13', startDate: '2026-08-24', endDate: '2026-09-07', status: 'PLANNED' },
    ],
    sprintConfig: { lengthWeeks: 2 },
    store: [
      { id: 'st_web1', title: '.env.example', kind: 'ENV', content: 'API_BASE_URL=https://api.northwind.dev\nAUTH_CLIENT_ID=web-app\nFEATURE_FLAG_SPRINTS=true', updatedBy: 'dana', updatedAt: '3d ago', history: [{ actor: 'dana', text: 'created this item', at: '9d ago' }, { actor: 'dana', text: 'edited the content', at: '3d ago' }] },
      { id: 'st_web2', title: 'Board & sprints — requirements', kind: 'DOC', content: "Optimistic drag and drop with server reconciliation. A sprint's end date is the source of truth for any task assigned to it. Board must render its first paint from a single request.", updatedBy: 'sam', updatedAt: '6d ago', history: [{ actor: 'sam', text: 'created this item', at: '6d ago' }] },
    ],
    blurb: 'The SPA — routing, the board, and everything the browser touches.',
    members: [{ userId: 'dana', role: 'LEAD' }, { userId: 'sam', role: 'CONTRIBUTOR' }, { userId: 'priya', role: 'CONTRIBUTOR' }, { userId: 'jonas', role: 'CONTRIBUTOR' }, { userId: 'tess', role: 'VIEWER' }],
    statuses: [
      { id: 's_todo', name: 'To Do', category: 'TODO' },
      { id: 's_prog', name: 'In Progress', category: 'IN_PROGRESS' },
      { id: 's_review', name: 'In Review', category: 'IN_PROGRESS' },
      { id: 's_done', name: 'Done', category: 'DONE' },
    ],
    issues: [
      iss('WEB', 4, 'Namespace every query key by org id', 'Task', 'Medium', 'jonas', 's_todo', 1000, { labels: ['tenancy'], due: '2026-08-25' }),
      iss('WEB', 9, 'Rebalance a column when its ranks grow too long', 'Task', 'Medium', 'jonas', 's_todo', 2000, { labels: ['board'] }),
      iss('WEB', 5, 'Backlog filters as typed search params', 'Task', 'Low', 'tess', 's_todo', 3000),
      iss('WEB', 12, 'Due date picker rejects dates in the past', 'Bug', 'Medium', null, 's_todo', 4000),
      iss('WEB', 6, 'Empty state for a project with no issues', 'Task', 'Low', null, 's_todo', 5000),
      iss('WEB', 2, 'Board drag and drop with optimistic move', 'Story', 'Urgent', 'dana', 's_prog', 1000, {
        sprintId: 'spr_w1', labels: ['board'], due: '2026-08-22', cc: ['sam'],
        comments: [
          comment('jonas', 'The client sends the two neighbours and the server derives the rank. Two browsers dropping into the same gap kept a total order.', '1d'),
          comment('dana', 'Then the only thing left is the rollback path — toast on failure, invalidate on settle.', '6h'),
        ],
        activity: [activity('dana', 'created this issue', '6d'), activity('dana', 'moved To Do → In Progress', '3d'), activity('dana', 'set priority to Urgent', '3d')],
      }),
      iss('WEB', 3, 'Invite acceptance for people without an account', 'Task', 'High', 'priya', 's_prog', 2000, { sprintId: 'spr_w1', labels: ['auth'], due: '2026-08-27' }),
      iss('WEB', 11, 'Refetch the board on window focus', 'Task', 'Low', 'dana', 's_prog', 3000, { sprintId: 'spr_w1' }),
      iss('WEB', 1, 'Org switcher clears the cache on change', 'Bug', 'High', 'sam', 's_review', 1000, {
        sprintId: 'spr_w1', labels: ['tenancy'], due: '2026-08-21', cc: ['dana', 'priya'],
        comments: [
          comment('sam', "Namespacing alone left the previous org's board on screen for a beat. Clearing on switch is what killed the flash.", '2d'),
          comment('dana', 'Both, then. The key factory refuses to build a key without an org id, so this stays fixed.', '2d'),
        ],
        activity: [activity('sam', 'created this issue', '5d'), activity('sam', 'moved In Progress → In Review', '2d')],
      }),
      iss('WEB', 8, 'Issue detail: comments and activity feed', 'Story', 'Medium', 'priya', 's_review', 2000, { sprintId: 'spr_w1', labels: ['issues'] }),
      iss('WEB', 7, 'A 401 refreshes once, then routes to login', 'Bug', 'High', 'sam', 's_done', 1000, { labels: ['auth'] }),
      iss('WEB', 10, 'Dense table and combobox primitives', 'Task', 'Low', 'tess', 's_done', 2000),
    ],
  };
}

function apiProject(): Project {
  return {
    id: 'p_api', key: 'API', name: 'Platform API', lead: 'sam', counter: 7,
    taskFields: defaultTaskFields({ priority: { required: true }, dueDate: { enabled: false } }),
    sprints: [{ id: 'spr_a1', name: 'Sprint 6', startDate: '2026-08-10', endDate: '2026-08-24', status: 'ACTIVE' }],
    sprintConfig: { lengthWeeks: 2 },
    store: [
      { id: 'st_api1', title: '.env.example', kind: 'ENV', content: 'DATABASE_URL=postgres://localhost/api_dev\nJWT_SECRET=change-me\nTENANT_HEADER=X-Org-Id', updatedBy: 'sam', updatedAt: '2d ago', history: [{ actor: 'sam', text: 'created this item', at: '8d ago' }, { actor: 'sam', text: 'edited the content', at: '2d ago' }] },
      { id: 'st_api2', title: 'Tenancy isolation — requirements', kind: 'DOC', content: 'Every query is scoped by org id at the repository layer, never in the handler. A foreign org id answers 404, never 403 — existence itself is tenant data.', updatedBy: 'jonas', updatedAt: '5d ago', history: [{ actor: 'jonas', text: 'created this item', at: '5d ago' }] },
    ],
    blurb: 'The four gates, and every write that touches a tenant row.',
    members: [{ userId: 'dana', role: 'LEAD' }, { userId: 'sam', role: 'LEAD' }, { userId: 'priya', role: 'CONTRIBUTOR' }, { userId: 'jonas', role: 'CONTRIBUTOR' }],
    statuses: [
      { id: 'a_todo', name: 'To Do', category: 'TODO' },
      { id: 'a_prog', name: 'In Progress', category: 'IN_PROGRESS' },
      { id: 'a_done', name: 'Done', category: 'DONE' },
    ],
    issues: [
      iss('API', 4, 'Coverage test for tenant-owned models', 'Task', 'High', 'jonas', 'a_todo', 1000, { labels: ['tenancy'], due: '2026-08-24' }),
      iss('API', 5, 'Transactional sender for invitation email', 'Task', 'Medium', 'tess', 'a_todo', 2000),
      iss('API', 6, 'Ban raw SQL in tenant paths', 'Task', 'Low', null, 'a_todo', 3000, { labels: ['tenancy'] }),
      iss('API', 1, 'Scoped client injects the organization id', 'Story', 'Urgent', 'dana', 'a_prog', 1000, {
        sprintId: 'spr_a1', labels: ['tenancy'], due: '2026-08-21',
        comments: [comment('jonas', 'It reads the request store, so no context argument threads through the services. Raw SQL still walks past it — that is API-6.', '3d')],
        activity: [activity('dana', 'created this issue', '8d'), activity('dana', 'moved To Do → In Progress', '5d')],
      }),
      iss('API', 3, 'Allocate the issue key inside the create transaction', 'Task', 'High', 'priya', 'a_prog', 2000, { sprintId: 'spr_a1', labels: ['issues'] }),
      iss('API', 2, 'A foreign org id answers 404, never 403', 'Task', 'Urgent', 'sam', 'a_done', 1000, { labels: ['tenancy'] }),
      iss('API', 7, 'A stale edit answers 409', 'Task', 'Medium', 'sam', 'a_done', 2000),
    ],
  };
}

function siteProject(): Project {
  return {
    id: 'p_site', key: 'SITE', name: 'Marketing Site', lead: 'marco', counter: 4,
    taskFields: defaultTaskFields(),
    sprints: [],
    sprintConfig: { lengthWeeks: 1 },
    store: [
      { id: 'st_site1', title: 'Brand guidelines link', kind: 'LINK', content: 'https://drive.mossco.internal/brand-guidelines-2026', updatedBy: 'marco', updatedAt: '9d ago', history: [{ actor: 'marco', text: 'created this item', at: '9d ago' }] },
    ],
    blurb: 'Contract work. You are a viewer here, so the board is read only.',
    members: [{ userId: 'marco', role: 'LEAD' }, { userId: 'ruth', role: 'CONTRIBUTOR' }, { userId: 'dana', role: 'VIEWER' }],
    statuses: [
      { id: 'm_todo', name: 'To Do', category: 'TODO' },
      { id: 'm_prog', name: 'In Progress', category: 'IN_PROGRESS' },
      { id: 'm_done', name: 'Done', category: 'DONE' },
    ],
    issues: [
      iss('SITE', 2, 'Cookie banner consent modes', 'Task', 'Low', 'ruth', 'm_todo', 1000),
      iss('SITE', 3, 'Hero image swap for the Q3 campaign', 'Task', 'Low', 'dana', 'm_todo', 2000),
      iss('SITE', 1, 'Pricing page copy review', 'Task', 'Medium', 'marco', 'm_prog', 1000, { due: '2026-08-23' }),
      iss('SITE', 4, 'Design a real 404 page', 'Task', 'Low', null, 'm_done', 1000),
    ],
  };
}

function studioProject(): Project {
  return {
    id: 'p_studio', key: 'STU', name: 'Studio Ops', lead: 'sam', counter: 2,
    taskFields: defaultTaskFields(),
    sprints: [],
    sprintConfig: { lengthWeeks: 2 },
    store: [],
    blurb: 'A fresh tenant. Nothing here can see Northwind or Moss.',
    members: [{ userId: 'sam', role: 'LEAD' }, { userId: 'dana', role: 'CONTRIBUTOR' }],
    statuses: [
      { id: 'h_todo', name: 'To Do', category: 'TODO' },
      { id: 'h_prog', name: 'In Progress', category: 'IN_PROGRESS' },
      { id: 'h_done', name: 'Done', category: 'DONE' },
    ],
    issues: [
      iss('STU', 1, 'Set up the studio calendar', 'Task', 'Medium', 'sam', 'h_todo', 1000),
      iss('STU', 2, 'Onboard the new retainer client', 'Task', 'High', 'dana', 'h_todo', 2000),
    ],
  };
}

export function seedOrgs(): Organization[] {
  return [
    {
      id: 'org_nw', name: 'Northwind Labs', slug: 'northwind', initial: 'N', status: 'ACTIVE', capacityHoursPerWeek: 40,
      members: [
        { userId: 'dana', role: 'ORG_ADMIN' }, { userId: 'sam', role: 'ORG_ADMIN' },
        { userId: 'priya', role: 'MEMBER' }, { userId: 'jonas', role: 'MEMBER' }, { userId: 'tess', role: 'MEMBER' },
      ],
      invites: [{ id: 'inv1', email: 'ada@northwind.co', role: 'MEMBER', at: 'sent 2d ago', token: 'inv_7Kq2x9' }],
      projects: [webProject(), apiProject()],
    },
    {
      id: 'org_moss', name: 'Moss & Company', slug: 'moss', initial: 'M', status: 'ACTIVE', capacityHoursPerWeek: 40,
      members: [{ userId: 'marco', role: 'ORG_ADMIN' }, { userId: 'dana', role: 'MEMBER' }, { userId: 'ruth', role: 'MEMBER' }],
      invites: [],
      projects: [siteProject()],
    },
    {
      id: 'org_harlow', name: 'Harlow Studio', slug: 'harlow', initial: 'H', status: 'ACTIVE', capacityHoursPerWeek: 40,
      members: [{ userId: 'sam', role: 'ORG_ADMIN' }, { userId: 'dana', role: 'ORG_ADMIN' }],
      invites: [],
      projects: [studioProject()],
    },
  ];
}

export function seedDiscoverableOrgs(): DiscoverableOrg[] {
  return [{ id: 'org_fieldstone', name: 'Fieldstone Co', slug: 'fieldstone', initial: 'F' }];
}
