import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Organization, User } from '@/types';

interface PeopleState {
  people: Record<string, User>;
  ensure: (ids: string[]) => Promise<void>;
}

// Backend responses carry userIds, not embedded profiles (mirrors the old
// static PEOPLE table). This cache resolves them, fetching only what's missing.
export const usePeopleStore = create<PeopleState>((set, get) => ({
  people: {},

  ensure: async (ids) => {
    const missing = [...new Set(ids)].filter((id) => id && !get().people[id]);
    if (missing.length === 0) return;
    const users = await api.get<User[]>(`/users?ids=${missing.join(',')}`);
    set((s) => ({
      people: { ...s.people, ...Object.fromEntries(users.map((u) => [u.id, u])) },
    }));
  },
}));

// Walks a fetched Organization tree for every userId it references, so the
// cache can be warmed with one bulk request before the org lands in state.
export function collectPersonIds(org: Organization): string[] {
  const ids = new Set<string>();
  org.members.forEach((m) => ids.add(m.userId));
  org.projects.forEach((p) => {
    ids.add(p.lead);
    p.members.forEach((m) => ids.add(m.userId));
    p.store.forEach((s) => {
      ids.add(s.updatedBy);
      s.history.forEach((h) => ids.add(h.actor));
    });
    p.issues.forEach((i) => {
      if (i.assignee) ids.add(i.assignee);
      i.cc.forEach((uid) => ids.add(uid));
      i.comments.forEach((c) => ids.add(c.author));
      i.activity.forEach((a) => ids.add(a.actor));
    });
  });
  return [...ids];
}

export async function warmPeopleCache(orgs: Organization[]): Promise<void> {
  const ids = new Set<string>();
  orgs.forEach((org) => collectPersonIds(org).forEach((id) => ids.add(id)));
  await usePeopleStore.getState().ensure([...ids]);
}
