import { useState } from 'react';
import { Modal, ModalTitle, ModalActions } from '@/components/ui/Modal';
import { TextInput, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useOrg } from '@/hooks/useScope';
import { useUiStore } from '@/store/uiStore';
import { useDataStore } from '@/store/dataStore';
import type { OrgRole } from '@/types';

export function InviteModal() {
  const open = useUiStore((s) => s.inviteOpen);
  const close = useUiStore((s) => s.closeModal);
  const org = useOrg();
  const inviteMember = useDataStore((s) => s.inviteMember);
  const toast = useDataStore((s) => s.toast);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('MEMBER');

  const handleClose = () => { close('inviteOpen'); setEmail(''); setRole('MEMBER'); };

  const submit = () => {
    if (!org) return;
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) { toast('Enter a valid email address', 'bad'); return; }
    inviteMember(org.id, trimmed, role);
    handleClose();
  };

  if (!open || !org) return null;

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalTitle>Invite to {org.name}</ModalTitle>
      <p className="text-neutral-600 leading-relaxed mb-4">
        Addressed to an email, not an account. Accepting the link is what creates the membership.
      </p>
      <TextInput
        value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com"
        className="mb-2.5"
      />
      <Select value={role} onChange={(e) => setRole(e.target.value as OrgRole)} className="mb-5">
        <option value="ORG_ADMIN">Org admin — manage members and projects</option>
        <option value="MEMBER">Member — only the projects they are added to</option>
      </Select>
      <ModalActions>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" onClick={submit}>Send invite</Button>
      </ModalActions>
    </Modal>
  );
}
