import { useEffect, useState } from 'react';
import { Modal, ModalTitle, ModalActions } from '@/components/ui/Modal';
import { TextInput, TextArea, Label } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { useAdminStore, adminErrorMessage, type CreatePlanInput } from '@/store/adminStore';
import { useDataStore } from '@/store/dataStore';
import { formatMoney } from '@/lib/format';
import type { SubscriptionPlan } from '@/types';

interface PlanForm {
  name: string;
  description: string;
  periodDays: string;
  priceInr: string;
  priceUsd: string;
  active: boolean;
}

const emptyForm: PlanForm = { name: '', description: '', periodDays: '30', priceInr: '', priceUsd: '', active: true };

function toForm(p: SubscriptionPlan): PlanForm {
  return {
    name: p.name,
    description: p.description,
    periodDays: String(p.periodDays),
    priceInr: String(p.priceInrPaise / 100),
    priceUsd: String(p.priceUsdCents / 100),
    active: p.active,
  };
}

export default function AdminPlans() {
  const plans = useAdminStore((s) => s.plans);
  const fetchPlans = useAdminStore((s) => s.fetchPlans);
  const createPlan = useAdminStore((s) => s.createPlan);
  const updatePlan = useAdminStore((s) => s.updatePlan);
  const toast = useDataStore((s) => s.toast);

  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPlans().catch((e) => toast(adminErrorMessage(e), 'bad')); }, [fetchPlans, toast]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: SubscriptionPlan) => { setEditing(p); setForm(toForm(p)); setOpen(true); };

  const submit = async () => {
    const periodDays = parseInt(form.periodDays, 10);
    const priceInrPaise = Math.round(parseFloat(form.priceInr || '0') * 100);
    const priceUsdCents = Math.round(parseFloat(form.priceUsd || '0') * 100);
    if (!form.name.trim() || !Number.isFinite(periodDays) || periodDays < 1) {
      toast('Give the plan a name and a valid period length', 'bad');
      return;
    }
    const input: CreatePlanInput = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      periodDays,
      priceInrPaise,
      priceUsdCents,
      active: form.active,
    };
    setSaving(true);
    try {
      if (editing) await updatePlan(editing.id, input);
      else await createPlan(input);
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
        <Button variant="primary" onClick={openCreate}>New plan</Button>
      </div>

      <div className="flex flex-col gap-3">
        {plans.length === 0 ? (
          <div className="bg-neutral-100 rounded-3xl px-6 py-6 text-sm text-neutral-600 shadow-sm">No plans yet.</div>
        ) : (
          plans.map((p) => (
            <button
              key={p.id}
              onClick={() => openEdit(p)}
              className="flex flex-wrap items-center gap-3 bg-neutral-100 rounded-3xl px-6 py-4 shadow-sm hover:shadow-md transition-shadow text-left cursor-pointer"
            >
              <div className="flex-1 min-w-[160px]">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{p.name}</div>
                  {!p.active && <Pill tone="neutral">Inactive</Pill>}
                  {p.priceUsdCents === 0 && p.priceInrPaise === 0 && <Pill tone="accent2">Free</Pill>}
                </div>
                {p.description && <div className="text-[12.5px] text-neutral-600 mt-0.5">{p.description}</div>}
              </div>
              <div className="text-sm font-semibold whitespace-nowrap">
                {p.priceUsdCents === 0 && p.priceInrPaise === 0 ? 'Free' : (
                  <>
                    {formatMoney(p.priceUsdCents, 'USD')} · {formatMoney(p.priceInrPaise, 'INR')}
                  </>
                )}
                <span className="text-neutral-600 font-normal"> / {p.periodDays}d</span>
              </div>
            </button>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalTitle>{editing ? 'Edit plan' : 'New plan'}</ModalTitle>
        <div className="flex flex-col gap-3 mb-5">
          <div>
            <Label>Name</Label>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pro" />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Period (days)</Label>
              <TextInput type="number" min={1} value={form.periodDays} onChange={(e) => setForm({ ...form, periodDays: e.target.value })} />
            </div>
            <div className="flex-1">
              <Label>Price (USD)</Label>
              <TextInput type="number" min={0} step="0.01" value={form.priceUsd} onChange={(e) => setForm({ ...form, priceUsd: e.target.value })} placeholder="29" />
            </div>
            <div className="flex-1">
              <Label>Price (INR)</Label>
              <TextInput type="number" min={0} step="0.01" value={form.priceInr} onChange={(e) => setForm({ ...form, priceInr: e.target.value })} placeholder="2000" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>{editing ? 'Save' : 'Create plan'}</Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
