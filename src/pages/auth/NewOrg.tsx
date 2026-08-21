import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { TextInput } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useDataStore } from '@/store/dataStore';
import { slugify } from '@/lib/format';

export default function NewOrg() {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const createOrg = useDataStore((s) => s.createOrg);
  const toast = useDataStore((s) => s.toast);
  const orgs = useDataStore((s) => s.orgs);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast('Give the organization a name', 'bad');
      return;
    }
    createOrg(trimmed);
    const slug = slugify(trimmed);
    navigate(`/o/${slug}/my-work`);
  };

  return (
    <AuthLayout>
      <h2 className="font-heading text-[32px] leading-tight mb-2">New organization</h2>
      <p className="text-neutral-600 mb-6">You become its owner. Everything you create afterwards lives inside it.</p>
      <div className="mb-2">
        <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600 mb-1">Name</div>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Okonjo & Partners" onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>
      <div className="text-[12.5px] text-neutral-600 mb-6">
        {name.trim() ? `manage.me/o/${slugify(name)}` : 'The slug is derived from the name.'}
      </div>
      <Button variant="primary" className="w-full" onClick={submit}>Create organization</Button>
      <button onClick={() => navigate(orgs.length ? '/orgs' : '/login')} className="block w-full text-center mt-4 text-[13px] text-accent-700 font-semibold cursor-pointer">
        Back
      </button>
    </AuthLayout>
  );
}
