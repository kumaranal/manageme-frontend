import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalTitle, ModalActions } from '@/components/ui/Modal';
import { TextInput } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useOrg } from '@/hooks/useScope';
import { useUiStore } from '@/store/uiStore';
import { useDataStore } from '@/store/dataStore';
import { deriveProjectKey } from '@/lib/format';

export function NewProjectModal() {
  const open = useUiStore((s) => s.newProjectOpen);
  const close = useUiStore((s) => s.closeModal);
  const org = useOrg();
  const createProject = useDataStore((s) => s.createProject);
  const toast = useDataStore((s) => s.toast);
  const navigate = useNavigate();
  const [name, setName] = useState('');

  const handleClose = () => { close('newProjectOpen'); setName(''); };

  const submit = async () => {
    if (!org) return;
    const trimmed = name.trim();
    if (!trimmed) { toast('Give the project a name', 'bad'); return; }
    const project = await createProject(org.id, trimmed);
    handleClose();
    if (project) navigate(`/o/${org.slug}/p/${project.key}/board`);
  };

  if (!open || !org) return null;

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalTitle>New project</ModalTitle>
      <p className="text-neutral-600 leading-relaxed mb-4">Creates an empty board with the default columns. You become its lead.</p>
      <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer Portal" className="mb-2.5" />
      <div className="text-[12.5px] text-neutral-600 mb-5">
        {name.trim() ? `Key: ${deriveProjectKey(name, org.projects.map((p) => p.key))}` : 'The key is derived from the name (e.g. "Customer Portal" → CPT).'}
      </div>
      <ModalActions>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" onClick={submit}>Create project</Button>
      </ModalActions>
    </Modal>
  );
}
