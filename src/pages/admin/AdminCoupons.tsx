import { useEffect, useState } from 'react';
import { Modal, ModalTitle, ModalActions } from '@/components/ui/Modal';
import { TextInput, Select, Label } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { useAdminStore, adminErrorMessage, type CreateCouponInput } from '@/store/adminStore';
import { useDataStore } from '@/store/dataStore';
import { formatMoney } from '@/lib/format';
import type { Coupon, CouponDiscountType } from '@/types';

interface CouponForm {
  code: string;
  discountType: CouponDiscountType;
  percentOff: string;
  fixedOffInr: string;
  fixedOffUsd: string;
  maxRedemptions: string;
  active: boolean;
  expiresAt: string;
}

const emptyForm: CouponForm = {
  code: '', discountType: 'PERCENT', percentOff: '', fixedOffInr: '', fixedOffUsd: '', maxRedemptions: '', active: true, expiresAt: '',
};

function toForm(c: Coupon): CouponForm {
  return {
    code: c.code,
    discountType: c.discountType,
    percentOff: c.percentOff != null ? String(c.percentOff) : '',
    fixedOffInr: c.fixedOffInrPaise != null ? String(c.fixedOffInrPaise / 100) : '',
    fixedOffUsd: c.fixedOffUsdCents != null ? String(c.fixedOffUsdCents / 100) : '',
    maxRedemptions: c.maxRedemptions != null ? String(c.maxRedemptions) : '',
    active: c.active,
    expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
  };
}

function describeDiscount(c: Coupon): string {
  if (c.discountType === 'PERCENT') return `${c.percentOff}% off`;
  const parts: string[] = [];
  if (c.fixedOffUsdCents != null) parts.push(formatMoney(c.fixedOffUsdCents, 'USD'));
  if (c.fixedOffInrPaise != null) parts.push(formatMoney(c.fixedOffInrPaise, 'INR'));
  return parts.length ? `${parts.join(' / ')} off` : 'Fixed discount';
}

export default function AdminCoupons() {
  const coupons = useAdminStore((s) => s.coupons);
  const fetchCoupons = useAdminStore((s) => s.fetchCoupons);
  const createCoupon = useAdminStore((s) => s.createCoupon);
  const updateCoupon = useAdminStore((s) => s.updateCoupon);
  const toast = useDataStore((s) => s.toast);

  const [editing, setEditing] = useState<Coupon | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCoupons().catch((e) => toast(adminErrorMessage(e), 'bad')); }, [fetchCoupons, toast]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (c: Coupon) => { setEditing(c); setForm(toForm(c)); setOpen(true); };

  const submit = async () => {
    if (!editing && !form.code.trim()) {
      toast('Give the coupon a code', 'bad');
      return;
    }
    const input: CreateCouponInput = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      percentOff: form.discountType === 'PERCENT' && form.percentOff ? parseInt(form.percentOff, 10) : undefined,
      fixedOffInrPaise: form.discountType === 'FIXED' && form.fixedOffInr ? Math.round(parseFloat(form.fixedOffInr) * 100) : undefined,
      fixedOffUsdCents: form.discountType === 'FIXED' && form.fixedOffUsd ? Math.round(parseFloat(form.fixedOffUsd) * 100) : undefined,
      maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions, 10) : undefined,
      active: form.active,
      expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : undefined,
    };
    if (input.discountType === 'PERCENT' && !input.percentOff) {
      toast('Set a percent-off value', 'bad');
      return;
    }
    if (input.discountType === 'FIXED' && !input.fixedOffInrPaise && !input.fixedOffUsdCents) {
      toast('Set at least one fixed-off amount', 'bad');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const { code: _code, discountType: _dt, ...rest } = input;
        await updateCoupon(editing.id, rest);
      } else {
        await createCoupon(input);
      }
      setOpen(false);
    } catch (e) {
      toast(adminErrorMessage(e), 'bad');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="primary" onClick={openCreate}>New coupon</Button>
      </div>

      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="hidden sm:flex items-center gap-3 px-6 pt-4 pb-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-600">
          <div className="flex-1">Code</div>
          <div className="w-[150px]">Discount</div>
          <div className="w-[120px]">Redemptions</div>
          <div className="w-[110px]">Status</div>
        </div>
        {coupons.length === 0 ? (
          <div className="px-6 py-6 text-sm text-neutral-600">No coupons yet.</div>
        ) : (
          coupons.map((c) => (
            <button
              key={c.id}
              onClick={() => openEdit(c)}
              className="w-full flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-t border-line text-left cursor-pointer hover:bg-ink/7"
            >
              <div className="flex-1 min-w-[140px] text-sm font-semibold">{c.code}</div>
              <div className="w-full sm:w-[150px] text-sm">{describeDiscount(c)}</div>
              <div className="w-full sm:w-[120px] text-sm">{c.timesRedeemed}{c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ''}</div>
              <div className="sm:w-[110px]">
                <Pill tone={c.active ? 'accent2' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</Pill>
              </div>
            </button>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalTitle>{editing ? `Edit ${editing.code}` : 'New coupon'}</ModalTitle>
        <div className="flex flex-col gap-3 mb-5">
          {!editing && (
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Code</Label>
                <TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE20" />
              </div>
              <div className="flex-1">
                <Label>Type</Label>
                <Select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as CouponDiscountType })}>
                  <option value="PERCENT">Percent off</option>
                  <option value="FIXED">Fixed amount off</option>
                </Select>
              </div>
            </div>
          )}

          {form.discountType === 'PERCENT' ? (
            <div>
              <Label>Percent off</Label>
              <TextInput type="number" min={1} max={100} value={form.percentOff} onChange={(e) => setForm({ ...form, percentOff: e.target.value })} placeholder="20" />
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Off (USD)</Label>
                <TextInput type="number" min={0} step="0.01" value={form.fixedOffUsd} onChange={(e) => setForm({ ...form, fixedOffUsd: e.target.value })} placeholder="10" />
              </div>
              <div className="flex-1">
                <Label>Off (INR)</Label>
                <TextInput type="number" min={0} step="0.01" value={form.fixedOffInr} onChange={(e) => setForm({ ...form, fixedOffInr: e.target.value })} placeholder="500" />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Max redemptions</Label>
              <TextInput type="number" min={1} value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })} placeholder="Unlimited" />
            </div>
            <div className="flex-1">
              <Label>Expires</Label>
              <TextInput type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>{editing ? 'Save' : 'Create coupon'}</Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
