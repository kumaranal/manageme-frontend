import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Select, TextInput, TextArea } from '@/components/ui/Field';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { File as FileIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useOrg, useProject, usePermissions, useMe } from '@/hooks/useScope';
import { useDataStore } from '@/store/dataStore';
import { usePeopleStore } from '@/store/peopleStore';
import { timeAgo, formatBytes } from '@/lib/format';
import { MAX_ATTACHMENT_SIZE } from '@/lib/storage';
import type { Issue, IssueType, Priority } from '@/types';

interface IssueDraft {
  type: IssueType;
  statusId: string;
  assignee: string | null;
  priority: Priority;
  estimatedHours: number | null;
  sprintId: string | null;
  due: string | null;
  labels: string;
  description: string;
  cc: string[];
}

const EMPTY_DRAFT: IssueDraft = {
  type: 'Task', statusId: '', assignee: null, priority: 'Medium',
  estimatedHours: null, sprintId: null, due: null, labels: '', description: '', cc: [],
};

function draftFromIssue(issue: Issue): IssueDraft {
  return {
    type: issue.type,
    statusId: issue.statusId,
    assignee: issue.assignee,
    priority: issue.priority,
    estimatedHours: issue.estimatedHours,
    sprintId: issue.sprintId ?? null,
    due: issue.due,
    labels: issue.labels.join(', '),
    description: issue.description,
    cc: [...issue.cc],
  };
}

const PAGE_SIZE = 3;

function Pager({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-1 mb-4">
      <Button
        variant="secondary"
        size="sm"
        className="h-6 px-2.5 gap-1 text-[11px] font-medium"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
      >
        ‹ Newer
      </Button>
      <div className="text-[11px] text-neutral-500">Page {page + 1} of {pageCount}</div>
      <Button
        variant="secondary"
        size="sm"
        className="h-6 px-2.5 gap-1 text-[11px] font-medium"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount - 1}
      >
        Older ›
      </Button>
    </div>
  );
}

function useImagePreviewUrls(files: File[]): (string | undefined)[] {
  const [urls, setUrls] = useState<(string | undefined)[]>([]);
  useEffect(() => {
    const next = files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined));
    setUrls(next);
    return () => { next.forEach((u) => u && URL.revokeObjectURL(u)); };
  }, [files]);
  return urls;
}

export function IssueDetailDrawer() {
  const [params, setParams] = useSearchParams();
  const org = useOrg();
  const project = useProject();
  const me = useMe();
  const { canEdit, isManager } = usePermissions();
  const updateIssue = useDataStore((s) => s.updateIssue);
  const addComment = useDataStore((s) => s.addComment);
  const addCc = useDataStore((s) => s.addCc);
  const removeCc = useDataStore((s) => s.removeCc);
  const addAttachments = useDataStore((s) => s.addAttachments);
  const removeAttachment = useDataStore((s) => s.removeAttachment);
  const toast = useDataStore((s) => s.toast);
  const [commentDraft, setCommentDraft] = useState('');
  const [draft, setDraft] = useState<IssueDraft>(EMPTY_DRAFT);
  const [draftIssueId, setDraftIssueId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const pendingPreviewUrls = useImagePreviewUrls(pendingFiles);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activityPage, setActivityPage] = useState(0);
  const [commentsPage, setCommentsPage] = useState(0);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const people = usePeopleStore((s) => s.people);

  const issueId = params.get('issue');
  const issue = project?.issues.find((i) => i.id === issueId);

  useEffect(() => {
    setActivityPage(0);
    setCommentsPage(0);
    setActiveTab('comments');
  }, [issueId]);

  // Re-seed the draft whenever a (different) issue is loaded, following
  // React's "adjusting state during render" pattern instead of an effect —
  // field edits only reach the server once the user clicks Save below.
  if (issue && issue.id !== draftIssueId) {
    setDraftIssueId(issue.id);
    setDraft(draftFromIssue(issue));
  }

  const close = () => {
    const next = new URLSearchParams(params);
    next.delete('issue');
    setParams(next, { replace: true });
    setDraftIssueId(null);
    setPendingFiles([]);
    setRemovedAttachmentIds([]);
  };

  if (!org || !project || !issue) return null;

  const statusReadOnly = !(isManager || issue.assignee === me);
  const estimatedReadOnly = !(canEdit || issue.assignee === me);
  const dueEditable = canEdit && !draft.sprintId;
  const canComment = canEdit;
  const key = `${project.key}-${issue.number}`;
  const ccCandidates = project.members.map((m) => m.userId).filter((id) => id !== draft.assignee && !draft.cc.includes(id));
  const visibleAttachments = issue.attachments.filter((a) => !removedAttachmentIds.includes(a.id));

  const computeChanges = () => {
    const patch: Partial<Issue> = {};
    const notes: string[] = [];
    if (draft.type !== issue.type) { patch.type = draft.type; notes.push(`set type to ${draft.type}`); }
    if (draft.statusId !== issue.statusId) {
      const from = project.statuses.find((s) => s.id === issue.statusId);
      const to = project.statuses.find((s) => s.id === draft.statusId);
      patch.statusId = draft.statusId;
      notes.push(`moved ${from?.name} → ${to?.name}`);
    }
    if (draft.assignee !== issue.assignee) {
      patch.assignee = draft.assignee;
      notes.push(draft.assignee ? `reassigned to ${people[draft.assignee]?.name}` : 'unassigned');
    }
    if (draft.priority !== issue.priority) { patch.priority = draft.priority; notes.push(`set priority to ${draft.priority}`); }
    if (draft.estimatedHours !== issue.estimatedHours) {
      patch.estimatedHours = draft.estimatedHours;
      notes.push(`set estimate to ${draft.estimatedHours ?? 0}h`);
    }
    if (draft.sprintId !== (issue.sprintId ?? null)) {
      const sprint = project.sprints.find((s) => s.id === draft.sprintId);
      patch.sprintId = draft.sprintId;
      notes.push(sprint ? `moved to ${sprint.name}` : 'moved to backlog');
    }
    if (draft.due !== issue.due) { patch.due = draft.due; notes.push(`set due date to ${draft.due ?? '—'}`); }
    const labelsArr = draft.labels.split(',').map((l) => l.trim()).filter(Boolean);
    if (labelsArr.join(',') !== issue.labels.join(',')) { patch.labels = labelsArr; notes.push('edited labels'); }
    if (draft.description !== issue.description) { patch.description = draft.description; notes.push('updated the description'); }
    return { patch, activityText: notes.length ? notes.join(', ') : undefined };
  };

  const { patch: pendingChanges, activityText: pendingActivityText } = computeChanges();
  const ccAdded = draft.cc.filter((id) => !issue.cc.includes(id));
  const ccRemoved = issue.cc.filter((id) => !draft.cc.includes(id));
  const dirty =
    Object.keys(pendingChanges).length > 0 ||
    ccAdded.length > 0 ||
    ccRemoved.length > 0 ||
    removedAttachmentIds.length > 0 ||
    pendingFiles.length > 0;

  const saveChanges = async () => {
    setSaving(true);
    try {
      if (Object.keys(pendingChanges).length > 0) {
        await updateIssue(org.id, project.id, issue.id, pendingChanges, pendingActivityText);
      }
      for (const uid of ccAdded) await addCc(org.id, project.id, issue.id, uid);
      for (const uid of ccRemoved) await removeCc(org.id, project.id, issue.id, uid);
      for (const attachmentId of removedAttachmentIds) await removeAttachment(org.id, project.id, issue.id, attachmentId);
      if (pendingFiles.length > 0) await addAttachments(org.id, project.id, issue.id, pendingFiles);
    } finally {
      setSaving(false);
      setPendingFiles([]);
      setRemovedAttachmentIds([]);
      // Some fields are normalized or derived server-side (e.g. `due` from a
      // sprint change) — re-seed from the refreshed issue rather than assume
      // the draft still matches what was saved.
      setDraftIssueId(null);
    }
  };

  const discardChanges = () => {
    setDraft(draftFromIssue(issue));
    setPendingFiles([]);
    setRemovedAttachmentIds([]);
  };

  return (
    <Drawer
      open
      onClose={close}
      header={
        <>
          <Pill tone="accent">{key}</Pill>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">{issue.type}</div>
        </>
      }
    >
      <h3 className="font-heading text-2xl leading-tight text-balance mb-5">{issue.title}</h3>

      <div className="mb-6">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600 mb-2">Description</div>
        <TextArea
          className="min-h-[100px]"
          placeholder="Add a description…"
          value={draft.description}
          disabled={!canEdit}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-[104px_1fr] gap-x-3 gap-y-2.5 items-center mb-4">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Type</div>
        <Select
          value={draft.type}
          disabled={!canEdit}
          onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as IssueType }))}
        >
          <option value="Task">Task</option>
          <option value="Story">Story</option>
          <option value="Bug">Bug</option>
        </Select>

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Status</div>
        <Select
          value={draft.statusId}
          disabled={statusReadOnly}
          onChange={(e) => setDraft((d) => ({ ...d, statusId: e.target.value }))}
        >
          {project.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Assignee</div>
        <Select
          value={draft.assignee ?? 'unassigned'}
          disabled={!canEdit}
          onChange={(e) => setDraft((d) => ({ ...d, assignee: e.target.value === 'unassigned' ? null : e.target.value }))}
        >
          <option value="unassigned">Unassigned</option>
          {project.members.map((m) => <option key={m.userId} value={m.userId}>{people[m.userId]?.name}</option>)}
        </Select>

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Priority</div>
        <Select
          value={draft.priority}
          disabled={!canEdit}
          onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as Priority }))}
        >
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </Select>

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Estimate</div>
        <div className="flex items-center gap-1.5">
          <TextInput
            type="number" min={0} step={0.5} className="w-[100px]"
            value={draft.estimatedHours ?? ''}
            disabled={estimatedReadOnly}
            onChange={(e) => setDraft((d) => ({ ...d, estimatedHours: e.target.value === '' ? null : Number(e.target.value) }))}
          />
          <div className="text-[12.5px] text-neutral-600">hours</div>
        </div>

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Sprint</div>
        <Select
          value={draft.sprintId ?? ''}
          disabled={!canEdit}
          onChange={(e) => setDraft((d) => ({ ...d, sprintId: e.target.value || null }))}
        >
          <option value="">Backlog (no sprint)</option>
          {project.sprints.map((s) => <option key={s.id} value={s.id}>{s.name} · ends {s.endDate}</option>)}
        </Select>

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Due</div>
        {dueEditable ? (
          <TextInput
            type="date"
            value={draft.due ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, due: e.target.value || null }))}
          />
        ) : (
          <div className="text-[13.5px]" title={draft.sprintId ? 'Set by the sprint end date' : undefined}>
            {issue.due ?? '—'}
          </div>
        )}

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Labels</div>
        <div className="min-w-0">
          {canEdit && (
            <TextInput
              className="mb-1.5 h-[34px]"
              placeholder="Labels, comma separated"
              value={draft.labels}
              onChange={(e) => setDraft((d) => ({ ...d, labels: e.target.value }))}
            />
          )}
          <div className="flex flex-wrap gap-1.5">
            {issue.labels.map((l) => (
              <Pill key={l} tone="accent2" size="sm" title={l} className="max-w-full min-w-0 truncate">{l}</Pill>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600 mb-2">Cc</div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {draft.cc.map((uid) => (
            <div key={uid} className="flex items-center gap-1.5 pl-0.5 pr-1.5 py-0.5 rounded-full bg-neutral-200">
              <Avatar userId={uid} size="xs" tone="accent2" />
              <div className="text-[12.5px] whitespace-nowrap">{people[uid]?.name}</div>
              {canComment && (
                <button onClick={() => setDraft((d) => ({ ...d, cc: d.cc.filter((id) => id !== uid) }))} className="text-[11px] text-neutral-600 hover:text-accent-700 cursor-pointer px-0.5">
                  ✕
                </button>
              )}
            </div>
          ))}
          {canComment && ccCandidates.length > 0 && (
            <select
              value=""
              onChange={(e) => { const uid = e.target.value; if (uid) setDraft((d) => ({ ...d, cc: [...d.cc, uid] })); }}
              className="h-7 border border-line rounded-full px-2.5 text-[12.5px] bg-canvas"
            >
              <option value="">+ Cc someone</option>
              {ccCandidates.map((uid) => <option key={uid} value={uid}>{people[uid]?.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600 mb-2">Attachments</div>
        <div className="flex flex-wrap gap-2 mb-2.5">
          {visibleAttachments.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              title={a.filename}
              className="group relative flex flex-col w-20 rounded-lg border border-line bg-canvas overflow-hidden no-underline"
            >
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setRemovedAttachmentIds((prev) => [...prev, a.id]);
                  }}
                  className="absolute top-0.5 right-0.5 z-10 w-4 h-4 flex items-center justify-center rounded-full bg-ink/70 text-white text-[10px] leading-none opacity-0 group-hover:opacity-100 cursor-pointer"
                  aria-label={`Remove ${a.filename}`}
                >
                  ✕
                </button>
              )}
              <div className="h-14 w-full flex items-center justify-center bg-ink/5">
                {a.mimeType.startsWith('image/') ? (
                  <img src={a.url} alt={a.filename} className="h-full w-full object-cover" />
                ) : (
                  <FileIcon className="h-6 w-6 text-neutral-500" />
                )}
              </div>
              <div className="px-1.5 py-1">
                <div className="truncate text-[11px] font-medium text-ink">{a.filename}</div>
                <div className="text-[10px] text-neutral-600">{formatBytes(a.size)}</div>
              </div>
            </a>
          ))}
          {pendingFiles.map((f, i) => (
            <div
              key={`pending-${f.name}-${i}`}
              title={f.name}
              className="group relative flex flex-col w-20 rounded-lg border border-dashed border-accent-500 bg-accent-200/30 overflow-hidden"
            >
              {canEdit && (
                <button
                  onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-0.5 right-0.5 z-10 w-4 h-4 flex items-center justify-center rounded-full bg-ink/70 text-white text-[10px] leading-none opacity-0 group-hover:opacity-100 cursor-pointer"
                  aria-label={`Remove ${f.name}`}
                >
                  ✕
                </button>
              )}
              <div className="h-14 w-full flex items-center justify-center bg-ink/5">
                {pendingPreviewUrls[i] ? (
                  <img src={pendingPreviewUrls[i]} alt={f.name} className="h-full w-full object-cover" />
                ) : (
                  <FileIcon className="h-6 w-6 text-neutral-500" />
                )}
              </div>
              <div className="px-1.5 py-1">
                <div className="truncate text-[11px] font-medium text-ink">{f.name}</div>
                <div className="text-[10px] text-neutral-600">pending</div>
              </div>
            </div>
          ))}
          {visibleAttachments.length === 0 && pendingFiles.length === 0 && (
            <div className="text-[13.5px] text-neutral-600">No attachments yet.</div>
          )}
        </div>
        {canEdit && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                e.target.value = '';
                if (files.length === 0) return;
                const oversized = files.find((f) => f.size > MAX_ATTACHMENT_SIZE);
                if (oversized) { toast(`${oversized.name} is larger than 25 MB`, 'bad'); return; }
                setPendingFiles((prev) => [...prev, ...files]);
              }}
            />
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>Attach files</Button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Button variant="primary" size="sm" onClick={saveChanges} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        <Button variant="secondary" size="sm" onClick={discardChanges} disabled={!dirty || saving}>Discard</Button>
      </div>

      <div className="flex items-center gap-1 mb-4 p-1 rounded-full bg-ink/7 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('comments')}
          className={cn(
            'h-7 px-4 rounded-full text-[12px] font-semibold tracking-wider uppercase transition-colors cursor-pointer',
            activeTab === 'comments' ? 'bg-canvas text-ink shadow-sm' : 'text-neutral-600 hover:text-ink',
          )}
        >
          Comments{issue.comments.length > 0 ? ` (${issue.comments.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={cn(
            'h-7 px-4 rounded-full text-[12px] font-semibold tracking-wider uppercase transition-colors cursor-pointer',
            activeTab === 'activity' ? 'bg-canvas text-ink shadow-sm' : 'text-neutral-600 hover:text-ink',
          )}
        >
          Activity{issue.activity.length > 0 ? ` (${issue.activity.length})` : ''}
        </button>
      </div>

      {activeTab === 'comments' ? (
        <>
          {canComment && (
            <div className="flex flex-col gap-2.5 mb-5">
              <TextArea
                placeholder="Leave a comment"
                className="min-h-[72px]"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!commentDraft.trim()) return;
                    addComment(org.id, project.id, issue.id, commentDraft.trim());
                    setCommentDraft('');
                  }}
                >
                  Comment
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 mb-1 min-h-[228px]">
            {issue.comments.slice(commentsPage * PAGE_SIZE, commentsPage * PAGE_SIZE + PAGE_SIZE).map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <Avatar userId={c.author} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 items-baseline mb-0.5">
                    <div className="text-[13.5px] font-semibold">{people[c.author]?.name}</div>
                    <div className="text-[11.5px] text-neutral-600">{timeAgo(c.at)}</div>
                  </div>
                  <div className="text-sm leading-relaxed text-balance">{c.body}</div>
                </div>
              </div>
            ))}
            {issue.comments.length === 0 && <div className="text-[13.5px] text-neutral-600">No comments yet.</div>}
          </div>
          <div className="mb-1">
            <Pager page={commentsPage} total={issue.comments.length} onChange={setCommentsPage} />
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2 min-h-[228px]">
            {issue.activity.slice(activityPage * PAGE_SIZE, activityPage * PAGE_SIZE + PAGE_SIZE).map((a) => (
              <div key={a.id} className="flex gap-2.5 items-baseline">
                <div className="w-[7px] h-[7px] rounded-full bg-neutral-400 mt-1.5 flex-none" />
                <div className="flex-1 text-[13px] text-neutral-800 leading-relaxed">{people[a.actor]?.name.split(' ')[0]} {a.text}</div>
                <div className="text-[11.5px] text-neutral-600 flex-none">{timeAgo(a.at)}</div>
              </div>
            ))}
            {issue.activity.length === 0 && <div className="text-[13.5px] text-neutral-600">No activity yet.</div>}
          </div>
          <Pager page={activityPage} total={issue.activity.length} onChange={setActivityPage} />
        </>
      )}
    </Drawer>
  );
}
