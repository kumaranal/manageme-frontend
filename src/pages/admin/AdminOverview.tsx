import { useEffect } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { formatMoney } from '@/lib/format';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 min-w-[140px] bg-neutral-100 rounded-2xl p-4 shadow-sm">
      <div className="font-heading text-[28px]">{value}</div>
      <div className="text-[12.5px] text-neutral-600">{label}</div>
    </div>
  );
}

export default function AdminOverview() {
  const overview = useAdminStore((s) => s.overview);
  const fetchOverview = useAdminStore((s) => s.fetchOverview);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  if (!overview) return <div className="text-sm text-neutral-600">Loading…</div>;

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="organizations" value={overview.organizations.total} />
        <StatCard label="active orgs" value={overview.organizations.active} />
        <StatCard label="suspended orgs" value={overview.organizations.suspended} />
        <StatCard label="new this month" value={overview.organizations.newThisMonth} />
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="users" value={overview.users.total} />
        <StatCard label="active subscriptions" value={overview.subscriptions.active} />
        <StatCard label="expired subscriptions" value={overview.subscriptions.expired} />
        <StatCard label="coupon redemptions" value={overview.coupons.totalRedemptions} />
      </div>

      <div className="bg-neutral-100 rounded-3xl p-5 shadow-sm">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600 mb-3">Revenue by currency</div>
        {overview.revenue.length === 0 ? (
          <div className="text-sm text-neutral-600">No payments yet.</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {overview.revenue.map((r) => (
              <div key={r.currency} className="flex-1 min-w-[160px] bg-canvas rounded-2xl p-4">
                <div className="font-heading text-2xl">{formatMoney(r.totalAmount, r.currency)}</div>
                <div className="text-[12.5px] text-neutral-600">{r.currency} · {r.paymentCount} payment{r.paymentCount === 1 ? '' : 's'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
