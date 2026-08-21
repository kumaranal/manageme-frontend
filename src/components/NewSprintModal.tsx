import { useState } from 'react';
import { Modal, ModalTitle, ModalActions } from '@/components/ui/Modal';
import { TextInput, Label } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useOrg, useProject } from '@/hooks/useScope';
import { useUiStore } from '@/store/uiStore';
import { useDataStore, nextSprintDefaults } from '@/store/dataStore';

export function NewSprintModal() {
  const open = useUiStore((s) => s.sprintCreateOpen);
  const close = useUiStore((s) => s.closeModal);
  const org = useOrg();
  const project = useProject();
  const createSprint = useDataStore((s) => s.createSprint);
  const toast = useDataStore((s) => s.toast);
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen && project) {
    setWasOpen(true);
    const d = nextSprintDefaults(project.sprintConfig.lengthWeeks, project.sprints.length);
    setName(d.name); setStart(d.start); setEnd(d.end);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  if (!open || !org || !project) return null;

  const handleClose = () => close('sprintCreateOpen');

  const submit = () => {
    if (!name.trim()) { toast('The sprint needs a name', 'bad'); return; }
    if (!start || !end) { toast('Set a start and end date', 'bad'); return; }
    if (end < start) { toast('End date is before the start date', 'bad'); return; }
    createSprint(org.id, project.id, name.trim(), start, end);
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} width={420}>
      <ModalTitle>New sprint</ModalTitle>
      <div className="mb-2.5">
        <Label>Name</Label>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex gap-2 mb-5">
        <div className="flex-1">
          <Label>Start</Label>
          <TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-[38px]" />
        </div>
        <div className="flex-1">
          <Label>End</Label>
          <TextInput type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-[38px]" />
        </div>
      </div>
      <ModalActions>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" onClick={submit}>Create sprint</Button>
      </ModalActions>
    </Modal>
  );
}
