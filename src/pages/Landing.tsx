import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  FileText,
  FolderKanban,
  Gauge,
  KanbanSquare,
  Layers,
  Link2,
  ListChecks,
  Menu,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { useBillingStore } from '@/store/billingStore';
import { formatMoney } from '@/lib/format';
import type { BillingCurrency, SubscriptionPlan } from '@/types';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
];

const FEATURES: { icon: typeof KanbanSquare; title: string; body: string; tone: 'accent' | 'accent2' }[] = [
  {
    icon: KanbanSquare,
    title: 'Kanban boards',
    body: 'Drag issues across custom statuses, filter by assignee or label, and keep every project moving without the clutter.',
    tone: 'accent',
  },
  {
    icon: ListChecks,
    title: 'Backlog & sprints',
    body: 'Groom the backlog, plan sprints with start and end dates, and move work from planned to active to closed.',
    tone: 'accent2',
  },
  {
    icon: Gauge,
    title: 'Workload views',
    body: 'See capacity across a project or the whole org by day, week, or month, so nobody is quietly overbooked.',
    tone: 'accent',
  },
  {
    icon: FolderKanban,
    title: 'Docs, env vars & links',
    body: 'A per-project store for the docs, environment variables, links, and notes your team actually needs on hand.',
    tone: 'accent2',
  },
  {
    icon: Users,
    title: 'Members & roles',
    body: 'Invite teammates by email, assign org and project roles — lead, contributor, viewer — and keep access scoped.',
    tone: 'accent',
  },
  {
    icon: ShieldCheck,
    title: 'Org & platform admin',
    body: 'Multi-org support out of the box, with a superadmin console for organizations, users, plans, and payments.',
    tone: 'accent2',
  },
];

const STORE_KINDS = [
  { icon: FileText, label: 'Docs' },
  { icon: Layers, label: 'Env vars' },
  { icon: Link2, label: 'Links' },
  { icon: StickyNote, label: 'Notes' },
];

const STEPS = [
  {
    n: '01',
    title: 'Create an organization',
    body: 'Spin up a workspace for your team in seconds, then invite members or let people join with an invite link.',
  },
  {
    n: '02',
    title: 'Set up a project',
    body: 'Add a project, define your statuses and issue types, and start filing tasks, stories, and bugs.',
  },
  {
    n: '03',
    title: 'Plan, ship, track',
    body: 'Groom the backlog into sprints, work the board, and watch workload and progress update as you go.',
  },
];

const PLAN_INCLUDES = [
  'Unlimited members & projects for this organization',
  'Kanban board, backlog & sprint planning',
  'Org and project workload views',
  'Project store — docs, env vars, links & notes',
  'Member invites, roles, and org admin tools',
];

function periodLabel(days: number): string {
  if (days === 30 || days === 31) return 'mo';
  if (days === 365 || days === 366) return 'yr';
  if (days === 7) return 'wk';
  return `${days} days`;
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function Feature({ icon: Icon, title, body, tone }: (typeof FEATURES)[number]) {
  return (
    <div className="rounded-2xl bg-neutral-100 border border-line p-6 h-full">
      <div
        className={
          'w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ' +
          (tone === 'accent' ? 'bg-accent-200 text-accent-700' : 'bg-accent2-200 text-accent2-700')
        }
      >
        <Icon size={20} />
      </div>
      <h3 className="font-heading text-[19px] mb-1.5">{title}</h3>
      <p className="text-[14.5px] text-neutral-700 leading-relaxed">{body}</p>
    </div>
  );
}

function PricingCard({
  plan,
  currency,
  highlighted,
}: {
  plan: SubscriptionPlan;
  currency: BillingCurrency;
  highlighted?: boolean;
}) {
  const amount = currency === 'INR' ? plan.priceInrPaise : plan.priceUsdCents;
  const isFree = amount === 0;
  return (
    <div
      className={
        'rounded-3xl p-7 flex flex-col relative ' +
        (highlighted ? 'bg-ink text-canvas shadow-lg md:-translate-y-3' : 'bg-neutral-100 border border-line')
      }
    >
      {highlighted && (
        <Pill tone="accent" className="absolute -top-3 left-7">
          Recommended
        </Pill>
      )}
      <h3 className="font-heading text-[22px] mb-1">{capitalize(plan.name)}</h3>
      <p className={'text-[13.5px] mb-5 ' + (highlighted ? 'text-canvas/70' : 'text-neutral-600')}>
        {plan.description || 'Full access to manage-me for this organization.'}
      </p>
      <div className="mb-6 flex items-baseline gap-1">
        <span className="font-heading text-[40px] leading-none">
          {isFree ? 'Free' : formatMoney(amount, currency)}
        </span>
        {!isFree && (
          <span className={'text-[13.5px] ' + (highlighted ? 'text-canvas/70' : 'text-neutral-600')}>
            /org/{periodLabel(plan.periodDays)}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-2.5 mb-7 flex-1">
        {PLAN_INCLUDES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[14px]">
            <Check size={16} className={'mt-0.5 flex-none ' + (highlighted ? 'text-accent-300' : 'text-accent-600')} />
            <span className={highlighted ? 'text-canvas/90' : 'text-neutral-800'}>{f}</span>
          </li>
        ))}
      </ul>
      <Link to="/signup">
        <Button variant={highlighted ? 'primary' : 'secondary'} className="w-full">
          {isFree ? 'Start for free' : 'Get started'}
        </Button>
      </Link>
    </div>
  );
}

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currency, setCurrency] = useState<BillingCurrency>('USD');
  const plans = useBillingStore((s) => s.plans);
  const plansLoaded = useBillingStore((s) => s.plansLoaded);
  const fetchPlans = useBillingStore((s) => s.fetchPlans);

  useEffect(() => {
    if (!plansLoaded) fetchPlans().catch(() => {});
  }, [plansLoaded, fetchPlans]);

  const gridClass =
    plans.length === 1
      ? 'max-w-sm mx-auto'
      : plans.length === 2
        ? 'grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto'
        : 'grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto';

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-50 bg-canvas/85 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="font-heading text-[22px]">manage-me</div>
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-[14px] font-semibold text-neutral-700 hover:text-ink no-underline">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">Get started</Button>
            </Link>
          </div>
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-ink/7"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-line px-5 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="text-[14.5px] font-semibold no-underline text-ink">
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1">
                <Button variant="secondary" className="w-full">Sign in</Button>
              </Link>
              <Link to="/signup" className="flex-1">
                <Button variant="primary" className="w-full">Get started</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute w-[520px] h-[520px] rounded-full bg-accent-200 opacity-50 -left-52 -top-40 pointer-events-none" />
        <div className="absolute w-[420px] h-[420px] rounded-full bg-accent2-200 opacity-50 -right-40 top-10 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28 relative">
          <div className="max-w-2xl">
            <Pill tone="accent" className="mb-5">
              <Sparkles size={12} className="mr-1" /> Project management, minus the bloat
            </Pill>
            <h1 className="font-heading text-[40px] md:text-[56px] leading-[1.05] mb-5">
              Plan the work.
              <br />
              Run the sprint.
              <br />
              Ship it.
            </h1>
            <p className="text-[17px] md:text-[19px] text-neutral-700 leading-relaxed mb-8 max-w-xl">
              manage-me is a lightweight home for boards, backlogs, and sprints — with the workload
              visibility and project docs your team actually opens, not the settings maze you don't.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button variant="primary" size="md" className="px-6">
                  Get started <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="md" className="px-6">
                  Sign in
                </Button>
              </Link>
            </div>
            <p className="text-[13px] text-neutral-600 mt-4">One flat plan per organization · Cancel anytime</p>
          </div>

          {/* Product mock */}
          <div className="mt-14 rounded-3xl bg-neutral-100 border border-line shadow-lg p-4 md:p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-accent-400" />
              <span className="w-3 h-3 rounded-full bg-accent2-400" />
              <span className="w-3 h-3 rounded-full bg-neutral-400" />
              <span className="ml-3 text-[12px] font-semibold text-neutral-600">manage-me · Sprint 14 board</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'To do', tone: 'neutral', cards: ['Design empty states', 'API rate limiting'] },
                { label: 'In progress', tone: 'accent', cards: ['Sprint report export', 'Invite flow polish'] },
                { label: 'Done', tone: 'accent2', cards: ['Workload heatmap', 'Org switcher'] },
              ].map((col) => (
                <div key={col.label} className="bg-canvas rounded-2xl p-3 border border-line">
                  <div className="text-[11.5px] font-semibold tracking-wider uppercase text-neutral-600 mb-2 px-1">
                    {col.label}
                  </div>
                  <div className="flex flex-col gap-2">
                    {col.cards.map((c) => (
                      <div key={c} className="bg-neutral-100 rounded-xl border border-line p-3 text-[13px] font-medium shadow-sm">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-xl mb-12">
          <div className="text-[12px] font-semibold tracking-wider uppercase text-accent-700 mb-2">Everything in one place</div>
          <h2 className="font-heading text-[32px] md:text-[38px] leading-tight">
            More than a board. Everything an org needs to plan and ship.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <Feature key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* Store spotlight */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="rounded-3xl bg-neutral-100 border border-line p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-[12px] font-semibold tracking-wider uppercase text-accent2-700 mb-2">Project store</div>
            <h2 className="font-heading text-[28px] md:text-[32px] leading-tight mb-4">
              Stop hunting for the .env someone shared in chat three weeks ago.
            </h2>
            <p className="text-[15px] text-neutral-700 leading-relaxed mb-6">
              Every project gets its own store for docs, environment variables, links, and notes —
              scoped to the people who should see them, and never more than a click from the board.
            </p>
            <div className="flex flex-wrap gap-3">
              {STORE_KINDS.map((k) => (
                <div key={k.label} className="flex items-center gap-2 bg-canvas rounded-full border border-line px-4 py-2">
                  <k.icon size={15} className="text-accent-700" />
                  <span className="text-[13.5px] font-semibold">{k.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: FileText, title: 'Onboarding guide', tone: 'accent' },
              { icon: Layers, title: 'Staging keys', tone: 'accent2' },
              { icon: Link2, title: 'Design files', tone: 'accent2' },
              { icon: StickyNote, title: 'Release notes', tone: 'accent' },
            ].map((c) => (
              <div key={c.title} className="bg-canvas rounded-2xl border border-line p-4 shadow-sm">
                <div
                  className={
                    'w-8 h-8 rounded-xl flex items-center justify-center mb-3 ' +
                    (c.tone === 'accent' ? 'bg-accent-200 text-accent-700' : 'bg-accent2-200 text-accent2-700')
                  }
                >
                  <c.icon size={15} />
                </div>
                <div className="text-[13.5px] font-semibold">{c.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-xl mb-12">
          <div className="text-[12px] font-semibold tracking-wider uppercase text-accent-700 mb-2">How it works</div>
          <h2 className="font-heading text-[32px] md:text-[38px] leading-tight">Up and running before your coffee's cold.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="relative">
              <div className="font-heading text-[42px] text-accent-300 mb-2">{s.n}</div>
              <h3 className="font-heading text-[20px] mb-2">{s.title}</h3>
              <p className="text-[14.5px] text-neutral-700 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workload / analytics callout */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="rounded-3xl bg-ink text-canvas p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-canvas/10 flex items-center justify-center mb-5">
              <BarChart3 size={20} />
            </div>
            <h2 className="font-heading text-[28px] md:text-[32px] leading-tight mb-4">
              See who's stretched thin before the sprint does.
            </h2>
            <p className="text-[15px] text-canvas/75 leading-relaxed">
              Workload views roll up hours by day, week, or month across a single project or the whole
              organization, so leads can rebalance before a deadline slips instead of after.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { name: 'Aditi R.', pct: 92 },
              { name: 'Sam O.', pct: 61 },
              { name: 'Priya K.', pct: 38 },
            ].map((p) => (
              <div key={p.name} className="bg-canvas/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2 text-[13.5px] font-semibold">
                  <span>{p.name}</span>
                  <span className="text-canvas/70">{p.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-canvas/15 overflow-hidden">
                  <div
                    className={'h-full rounded-full ' + (p.pct > 85 ? 'bg-accent-400' : 'bg-accent2-400')}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-xl mx-auto text-center mb-10">
          <div className="text-[12px] font-semibold tracking-wider uppercase text-accent-700 mb-2">Pricing</div>
          <h2 className="font-heading text-[32px] md:text-[38px] leading-tight mb-4">One straightforward plan per organization.</h2>
          <p className="text-[15px] text-neutral-700">
            No per-seat pricing games — every organization gets full access to manage-me. Cancel anytime.
          </p>
        </div>

        {plansLoaded && plans.length > 0 && (
          <div className="flex items-center justify-center mb-10">
            <div className="inline-flex bg-neutral-100 border border-line rounded-full p-1">
              {(['USD', 'INR'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={
                    'px-4 py-1.5 rounded-full text-[13.5px] font-semibold cursor-pointer transition-colors ' +
                    (currency === c ? 'bg-accent text-canvas' : 'text-neutral-700')
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {!plansLoaded ? (
          <div className="text-center text-[14.5px] text-neutral-600">Loading pricing…</div>
        ) : plans.length === 0 ? (
          <div className="text-center text-[14.5px] text-neutral-600">
            Pricing is being finalized — <Link to="/signup" className="text-accent-700 font-semibold no-underline">sign up</Link> and we'll get you sorted.
          </div>
        ) : (
          <div className={gridClass}>
            {plans.map((plan, i) => (
              <PricingCard key={plan.id} plan={plan} currency={currency} highlighted={plans.length > 1 && i === plans.length - 1} />
            ))}
          </div>
        )}
        <p className="text-center text-[12.5px] text-neutral-600 mt-8">
          Prices shown per organization. Your workspace admin can adjust plans and coupons anytime from the admin console.
        </p>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="rounded-3xl bg-accent-200 p-10 md:p-14 text-center">
          <h2 className="font-heading text-[30px] md:text-[36px] leading-tight mb-4">Ready to run your next sprint in manage-me?</h2>
          <p className="text-[15px] text-accent-800/80 mb-7 max-w-lg mx-auto">
            Create your organization, invite your team, and open your first board in under two minutes.
          </p>
          <Link to="/signup">
            <Button variant="primary" size="md" className="px-7">
              Get started <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-heading text-[18px]">manage-me</div>
          <div className="flex gap-6 text-[13.5px] text-neutral-600">
            <a href="#features" className="no-underline text-neutral-600 hover:text-ink">Features</a>
            <a href="#pricing" className="no-underline text-neutral-600 hover:text-ink">Pricing</a>
            <Link to="/login" className="no-underline text-neutral-600 hover:text-ink">Sign in</Link>
          </div>
          <div className="text-[12.5px] text-neutral-500">© {new Date().getFullYear()} manage-me</div>
        </div>
      </footer>
    </div>
  );
}
