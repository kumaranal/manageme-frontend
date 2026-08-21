import { useState } from 'react';
import { Modal, ModalTitle, ModalActions } from '@/components/ui/Modal';
import { TextInput, TextArea, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useOrg, useProject } from '@/hooks/useScope';
import { useUiStore } from '@/store/uiStore';
import { useDataStore } from '@/store/dataStore';
import type { StoreKind } from '@/types';

export function StoreItemCreateModal() {
  const open = useUiStore((s) => s.storeCreateOpen);
  const close = useUiStore((s) => s.closeModal);
  const org = useOrg();
  const project = useProject();
  const createStoreItem = useDataStore((s) => s.createStoreItem);
  const toast = useDataStore((s) => s.toast);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<StoreKind>('DOC');
  const [content, setContent] = useState('');

  const reset = () => { setTitle(''); setKind('DOC'); setContent(''); };
  const handleClose = () => { close('storeCreateOpen'); reset(); };

  const submit = () => {
    if (!org || !project) return;
    if (!title.trim()) { toast('Give it a name', 'bad'); return; }
    createStoreItem(org.id, project.id, { title: title.trim(), kind, content });
    handleClose();
  };

  if (!open || !project) return null;

  return (
    <Modal open={open} onClose={handleClose} width={492}>
      <ModalTitle>Add to the store</ModalTitle>
      <TextInput
        value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name — e.g. .env.production"
        className="h-11 mb-2.5"
      />
      <Select value={kind} onChange={(e) => setKind(e.target.value as StoreKind)} className="mb-2.5">
        <option value="DOC">Doc — requirements, spec</option>
        <option value="ENV">Env file</option>
        <option value="NOTE">Note</option>
        <option value="LINK">Link</option>
      </Select>
      <TextArea
        value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste content here" rows={7}
        className="font-mono text-[13.5px] mb-5"
      />
      <ModalActions>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" onClick={submit}>Add</Button>
      </ModalActions>
    </Modal>
  );
}
