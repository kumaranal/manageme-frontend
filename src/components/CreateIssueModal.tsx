import { useState } from 'react';
import { Modal, ModalTitle, ModalActions } from '@/components/ui/Modal';
import { TextInput, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useOrg, useProject } from '@/hooks/useScope';
import { useUiStore } from '@/store/uiStore';
import { useDataStore } from '@/store/dataStore';
import { PEOPLE } from '@/data/people';
import type { IssueType, Priority } from '@/types';

function findField(project: NonNullable<ReturnType<typeof useProject>>, id: string) {
  return project.taskFields.find((f) => f.id === id);
}

export function CreateIssueModal() {
  const open = useUiStore((s) => s.createIssueOpen);
  const close = useUiStore((s) => s.closeModal);
  const org = useOrg();
  const project = useProject();
  const createIssue = useDataStore((s) => s.createIssue);
  const toast = useDataStore((s) => s.toast);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<IssueType>('Task');
  const [statusId, setStatusId] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [assignee, setAssignee] = useState('unassigned');
  const [due, setDue] = useState('');
  const [labels, setLabels] = useState('');
  const [estimated, setEstimated] = useState('');
  const [sprintId, setSprintId] = useState('');

  // Re-seed the draft fields each time the modal opens, following React's
  // "adjusting state during render" pattern instead of an effect.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen && project) {
    setWasOpen(true);
    setTitle(''); setType('Task'); setStatusId(project.statuses[0]?.id ?? '');
    setPriority('Medium'); setAssignee('unassigned'); setDue(''); setLabels(''); setEstimated('');
    const active = project.sprints.find((s) => s.status === 'ACTIVE');
    setSprintId(active ? active.id : '');
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  if (!open || !org || !project) return null;

  const priorityField = findField(project, 'priority');
  const assigneeField = findField(project, 'assignee');
  const dueField = findField(project, 'dueDate');
  const labelsField = findField(project, 'labels');
  const estimatedField = findField(project, 'estimatedHours');

  const handleClose = () => close('createIssueOpen');

  const submit = () => {
    if (!title.trim()) { toast('The issue needs a title', 'bad'); return; }
    if (assigneeField?.required && assignee === 'unassigned') { toast('Assignee is required for this project', 'bad'); return; }
    if (dueField?.required && !sprintId && !due) { toast('Due date is required for this project', 'bad'); return; }
    if (labelsField?.required && !labels.trim()) { toast('Labels are required for this project', 'bad'); return; }
    if (estimatedField?.required && !estimated) { toast('Estimated hours is required for this project', 'bad'); return; }

    createIssue(org.id, project.id, {
      title: title.trim(), type, statusId, priority,
      assignee: assignee === 'unassigned' ? null : assignee,
      due: due || null,
      labels: labels.split(',').map((l) => l.trim()).filter(Boolean),
      estimatedHours: estimated === '' ? null : Number(estimated),
      sprintId: sprintId || null,
    });
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} width={492}>
      <div className="flex items-baseline gap-2.5 mb-4">
        <ModalTitle>New Task</ModalTitle>
        <div className="text-[12.5px] text-neutral-600">{project.key}-{project.counter + 1}</div>
      </div>
      <TextInput
        value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?"
        className="h-11 mb-2.5" autoFocus
      />
      <div className="flex gap-2 mb-2.5 flex-wrap">
        <Select value={type} onChange={(e) => setType(e.target.value as IssueType)} className="w-[110px] h-[38px]">
          <option value="Task">Task</option>
          <option value="Story">Story</option>
          <option value="Bug">Bug</option>
        </Select>
        <Select value={statusId} onChange={(e) => setStatusId(e.target.value)} className="flex-1 h-[38px]">
          {project.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        {priorityField?.enabled && (
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-[126px] h-[38px]">
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </Select>
        )}
        {assigneeField?.enabled && (
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="flex-1 h-[38px]">
            <option value="unassigned">Unassigned</option>
            {project.members.map((m) => <option key={m.userId} value={m.userId}>{PEOPLE[m.userId].name}</option>)}
          </Select>
        )}
      </div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {dueField?.enabled && !sprintId && (
          <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} className="flex-1 h-[38px]" />
        )}
        {labelsField?.enabled && (
          <TextInput value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="Labels, comma separated" className="flex-1 h-[38px]" />
        )}
        {estimatedField?.enabled && (
          <TextInput type="number" min={0} step={0.5} value={estimated} onChange={(e) => setEstimated(e.target.value)} placeholder="Estimated hours" className="w-[150px] h-[38px]" />
        )}
      </div>
      {project.sprints.length > 0 && (
        <Select value={sprintId} onChange={(e) => setSprintId(e.target.value)} className="w-full h-[38px] mb-5">
          <option value="">Backlog (no sprint)</option>
          {project.sprints.map((s) => (
            <option key={s.id} value={s.id}>{s.name} · {s.status === 'ACTIVE' ? 'active' : s.status === 'CLOSED' ? 'closed' : 'planned'}</option>
          ))}
        </Select>
      )}
      <ModalActions>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" onClick={submit}>Create</Button>
      </ModalActions>
    </Modal>
  );
}
