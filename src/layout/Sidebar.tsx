import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { OrgAvatar, Avatar } from '@/components/ui/Avatar';
import { useDataStore } from '@/store/dataStore';
import { useAuthStore } from '@/store/authStore';
import { useOrg, useMe } from '@/hooks/useScope';
import { usePeopleStore } from '@/store/peopleStore';
import { orgRole } from '@/lib/permissions';
import { useUiStore } from '@/store/uiStore';

export function Sidebar() {
  const org = useOrg();
  const me = useMe();
  const orgs = useDataStore((s) => s.orgs);
  const toast = useDataStore((s) => s.toast);
  const navigate = useNavigate();
  const location = useLocation();
  const signOut = useAuthStore((s) => s.signOut);
  const isSuperadmin = useAuthStore((s) => s.profile?.isSuperadmin);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const person = usePeopleStore((s) => s.people[me]);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const closeMobileNav = useUiStore((s) => s.closeMobileNav);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  if (!org) return null;
  const myRole = orgRole(org, me);
  const activeProjectKey = location.pathname.match(/\/p\/([^/]+)/)?.[1];
  const view = location.pathname.split('/').filter(Boolean).pop();

  const switchOrg = (slug: string) => {
    setMenuOpen(false);
    closeMobileNav();
    navigate(`/o/${slug}/my-work`);
    toast(`Switched to ${orgs.find((o) => o.slug === slug)?.name ?? slug}`);
  };

  const navItems: { id: string; label: string; count?: number; to: string }[] = [
    { id: 'my-work', label: 'My work', count: org.projects.reduce((n, p) => n + p.issues.filter((i) => i.assignee === me).length, 0), to: `/o/${org.slug}/my-work` },
    { id: 'projects', label: 'Projects', count: org.projects.length, to: `/o/${org.slug}/projects` },
    { id: 'members', label: 'Members & invites', count: org.members.length, to: `/o/${org.slug}/members` },
  ];
  if (myRole === 'ORG_ADMIN') {
    navItems.push({ id: 'workload', label: 'Workload', count: org.members.length, to: `/o/${org.slug}/workload` });
    navItems.push({ id: 'settings', label: 'Settings', to: `/o/${org.slug}/settings` });
  }

  return (
    <>
      {mobileNavOpen && (
        <div onClick={closeMobileNav} className="fixed inset-0 z-40 bg-ink/28 md:hidden" />
      )}
      <div
        className={clsx(
          'w-[266px] flex-none bg-surface border-r border-line flex flex-col h-full',
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out',
          'md:static md:z-auto md:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
      <div className="p-3 relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-accent-200 hover:bg-accent-300 cursor-pointer transition-colors text-left"
        >
          <OrgAvatar initial={org.initial} tone="solid" size="md" />
          <div className="flex-1 min-w-0">
            <div className="font-heading text-[15px] leading-tight truncate">{org.name}</div>
            <div className="text-[11.5px] font-semibold tracking-wider uppercase text-accent-700">
              {myRole === 'ORG_ADMIN' ? 'org admin' : 'member'}
            </div>
          </div>
          <ChevronDown size={13} className="text-accent-700" />
        </button>
        {menuOpen && (
          <div className="absolute left-3 right-3 top-[70px] bg-neutral-100 rounded-2xl shadow-lg z-60 overflow-hidden">
            <div className="px-4 pt-2.5 pb-1 text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Your organizations</div>
            {orgs.map((o) => (
              <button
                key={o.id}
                onClick={() => switchOrg(o.slug)}
                className="w-full flex items-center gap-2.5 px-4 py-2 cursor-pointer hover:bg-neutral-200 text-left"
              >
                <OrgAvatar initial={o.initial} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{o.name}</div>
                  <div className="text-[11.5px] text-neutral-600">{orgRole(o, me) === 'ORG_ADMIN' ? 'org admin' : 'member'}</div>
                </div>
                {o.id === org.id && <div className="w-2 h-2 rounded-full bg-accent" />}
              </button>
            ))}
            {isSuperadmin && (
              <>
                <div className="border-t border-line" />
                <button
                  onClick={() => { setMenuOpen(false); closeMobileNav(); navigate('/admin'); }}
                  className="w-full px-4 py-2.5 text-[13.5px] font-semibold text-accent-700 cursor-pointer hover:bg-neutral-200 text-left"
                >
                  Platform admin
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-3 flex flex-col gap-0.5">
        {navItems.map((n) => (
          <Link
            key={n.id}
            to={n.to}
            onClick={closeMobileNav}
            className={clsx(
              'flex items-center gap-2 px-3 py-2.5 rounded-full text-sm no-underline text-ink',
              view === n.id ? 'bg-accent-200 text-accent-700 font-semibold' : 'hover:bg-ink/7',
            )}
          >
            <div className="flex-1">{n.label}</div>
            {n.count !== undefined && <div className="text-xs text-neutral-600">{n.count}</div>}
          </Link>
        ))}
      </div>

      <div className="px-6 pt-6 pb-2 flex items-baseline justify-between">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Projects</div>
        <div className="text-[11.5px] text-neutral-600">{org.projects.length}</div>
      </div>
      <div className="px-3 flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0">
        {org.projects.filter((p) => !p.archived).map((p) => (
          <Link
            key={p.id}
            to={`/o/${org.slug}/p/${p.key}/board`}
            onClick={closeMobileNav}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-full text-sm no-underline text-ink',
              p.key === activeProjectKey ? 'bg-ink/7 font-semibold' : 'hover:bg-ink/7',
            )}
          >
            <span className="min-w-[40px] text-center px-2 py-0.5 rounded-full bg-accent2-200 text-accent2-700 text-[11px] font-semibold tracking-wide">
              {p.key}
            </span>
            <span className="flex-1 min-w-0 truncate">{p.name}</span>
          </Link>
        ))}
      </div>

      <div className="border-t border-line p-3 flex items-center gap-2.5">
        <Avatar userId={me} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold">{person?.name}</div>
          <div className="text-[11.5px] text-neutral-600 truncate">{person?.email}</div>
        </div>
        <button onClick={() => { signOut(); navigate('/login'); }} className="text-xs text-accent-700 font-semibold cursor-pointer">
          Out
        </button>
      </div>
      </div>
    </>
  );
}
