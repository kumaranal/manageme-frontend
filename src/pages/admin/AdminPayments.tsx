import { useEffect, useState } from 'react';
import { useAdminStore, adminErrorMessage } from '@/store/adminStore';
import { useDataStore } from '@/store/dataStore';
import { Select } from '@/components/ui/Field';
import { Pill } from '@/components/ui/Pill';
import { Pagination } from '@/components/ui/Pagination';
import { formatMoney, timeAgo } from '@/lib/format';
import type { BillingCurrency, PaymentGateway } from '@/types';

export default function AdminPayments() {
  const payments = useAdminStore((s) => s.payments);
  const fetchPayments = useAdminStore((s) => s.fetchPayments);
  const toast = useDataStore((s) => s.toast);
  const [gateway, setGateway] = useState<PaymentGateway | ''>('');
  const [currency, setCurrency] = useState<BillingCurrency | ''>('');

  useEffect(() => {
    fetchPayments(1, gateway || undefined, currency || undefined).catch((e) => toast(adminErrorMessage(e), 'bad'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway, currency]);

  const goToPage = (p: number) => {
    fetchPayments(p, gateway || undefined, currency || undefined).catch((e) => toast(adminErrorMessage(e), 'bad'));
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Select value={gateway} onChange={(e) => setGateway(e.target.value as PaymentGateway | '')} className="w-auto">
          <option value="">All gateways</option>
          <option value="STRIPE">Stripe</option>
          <option value="RAZORPAY">Razorpay</option>
        </Select>
        <Select value={currency} onChange={(e) => setCurrency(e.target.value as BillingCurrency | '')} className="w-auto">
          <option value="">All currencies</option>
          <option value="USD">USD</option>
          <option value="INR">INR</option>
        </Select>
      </div>

      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="hidden sm:flex items-center gap-3 px-6 pt-4 pb-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-600">
          <div className="flex-1">Organization</div>
          <div className="w-[180px]">Paid by</div>
          <div className="w-[110px]">Amount</div>
          <div className="w-[100px]">Gateway</div>
          <div className="w-[110px]">When</div>
        </div>
        {!payments ? (
          <div className="px-6 py-6 text-sm text-neutral-600">Loading…</div>
        ) : payments.items.length === 0 ? (
          <div className="px-6 py-6 text-sm text-neutral-600">No payments found.</div>
        ) : (
          payments.items.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-t border-line">
              <div className="flex-1 min-w-[160px]">
                <div className="text-sm font-semibold truncate">{p.org.name}</div>
                <div className="text-[11.5px] text-neutral-600">{p.org.slug}</div>
              </div>
              <div className="w-full sm:w-[180px] text-sm truncate">{p.user.email}</div>
              <div className="w-full sm:w-[110px] text-sm font-semibold">{formatMoney(p.amount, p.currency)}</div>
              <div className="sm:w-[100px]">
                <Pill tone="outline">{p.gatewayPaymentId === 'FREE' ? 'Free' : p.gateway}</Pill>
              </div>
              <div className="w-full sm:w-[110px] text-[12.5px] text-neutral-600">{timeAgo(p.createdAt)}</div>
            </div>
          ))
        )}
      </div>

      {payments && (
        <Pagination page={payments.page} pageSize={payments.pageSize} total={payments.total} onChange={goToPage} />
      )}
    </div>
  );
}
