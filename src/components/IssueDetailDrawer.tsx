import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Select, TextInput, TextArea } from '@/components/ui/Field';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useOrg, useProject, usePermissions, useMe } from '@/hooks/useScope';
import { useDataStore } from '@/store/dataStore';
import { usePeopleStore } from '@/store/peopleStore';
import { timeAgo } from '@/lib/format';
import type { IssueType, Priority } from '@/types';

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
  const [commentDraft, setCommentDraft] = useState('');
  const [labelsDraft, setLabelsDraft] = useState<string | null>(null);
  const ACTIVITY_PAGE_SIZE = 8;
  const [activityVisible, setActivityVisible] = useState(ACTIVITY_PAGE_SIZE);
  const people = usePeopleStore((s) => s.people);

  const issueId = params.get('issue');
  const issue = project?.issues.find((i) => i.id === issueId);

  useEffect(() => {
    setActivityVisible(ACTIVITY_PAGE_SIZE);
  }, [issueId]);

  const close = () => {
    const next = new URLSearchParams(params);
    next.delete('issue');
    setParams(next, { replace: true });
    setLabelsDraft(null);
  };

  if (!org || !project || !issue) return null;

  const statusReadOnly = !(isManager || issue.assignee === me);
  const estimatedReadOnly = !(canEdit || issue.assignee === me);
  const dueEditable = canEdit && !issue.sprintId;
  const canComment = canEdit;
  const key = `${project.key}-${issue.number}`;
  const ccCandidates = project.members.map((m) => m.userId).filter((id) => id !== issue.assignee && !issue.cc.includes(id));

  const patch = (p: Partial<typeof issue>, text?: string) => updateIssue(org.id, project.id, issue.id, p, text);

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

      <div className="grid grid-cols-[104px_1fr] gap-x-3 gap-y-2.5 items-center mb-6">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Type</div>
        <Select
          value={issue.type}
          disabled={!canEdit}
          onChange={(e) => patch({ type: e.target.value as IssueType }, `set type to ${e.target.value}`)}
        >
          <option value="Task">Task</option>
          <option value="Story">Story</option>
          <option value="Bug">Bug</option>
        </Select>

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Status</div>
        <Select
          value={issue.statusId}
          disabled={statusReadOnly}
          onChange={(e) => {
            const to = project.statuses.find((s) => s.id === e.target.value);
            const from = project.statuses.find((s) => s.id === issue.statusId);
            patch({ statusId: e.target.value }, `moved ${from?.name} → ${to?.name}`);
          }}
        >
          {project.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Assignee</div>
        <Select
          value={issue.assignee ?? 'unassigned'}
          disabled={!canEdit}
          onChange={(e) => {
            const val = e.target.value === 'unassigned' ? null : e.target.value;
            patch({ assignee: val }, val ? `reassigned to ${people[val]?.name}` : 'unassigned');
          }}
        >
          <option value="unassigned">Unassigned</option>
          {project.members.map((m) => <option key={m.userId} value={m.userId}>{people[m.userId]?.name}</option>)}
        </Select>

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Priority</div>
        <Select
          value={issue.priority}
          disabled={!canEdit}
          onChange={(e) => patch({ priority: e.target.value as Priority }, `set priority to ${e.target.value}`)}
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
            value={issue.estimatedHours ?? ''}
            disabled={estimatedReadOnly}
            onChange={(e) => patch({ estimatedHours: e.target.value === '' ? null : Number(e.target.value) }, `set estimate to ${e.target.value}h`)}
          />
          <div className="text-[12.5px] text-neutral-600">hours</div>
        </div>

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Sprint</div>
        <Select
          value={issue.sprintId ?? ''}
          disabled={!canEdit}
          onChange={(e) => {
            const val = e.target.value || null;
            const sprint = project.sprints.find((s) => s.id === val);
            patch({ sprintId: val }, sprint ? `moved to ${sprint.name}` : 'moved to backlog');
          }}
        >
          <option value="">Backlog (no sprint)</option>
          {project.sprints.map((s) => <option key={s.id} value={s.id}>{s.name} · ends {s.endDate}</option>)}
        </Select>

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Due</div>
        {dueEditable ? (
          <TextInput
            type="date"
            value={issue.due ?? ''}
            onChange={(e) => patch({ due: e.target.value || null }, `set due date to ${e.target.value}`)}
          />
        ) : (
          <div className="text-[13.5px]" title={issue.sprintId ? 'Set by the sprint end date' : undefined}>
            {issue.due ?? '—'}
          </div>
        )}

        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Labels</div>
        <div className="min-w-0">
          {canEdit && (
            <TextInput
              className="mb-1.5 h-[34px]"
              placeholder="Labels, comma separated"
              value={labelsDraft ?? issue.labels.join(', ')}
              onChange={(e) => setLabelsDraft(e.target.value)}
              onBlur={() => {
                if (labelsDraft === null) return;
                patch({ labels: labelsDraft.split(',').map((l) => l.trim()).filter(Boolean) }, 'edited labels');
                setLabelsDraft(null);
              }}
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
          {issue.cc.map((uid) => (
            <div key={uid} className="flex items-center gap-1.5 pl-0.5 pr-1.5 py-0.5 rounded-full bg-neutral-200">
              <Avatar userId={uid} size="xs" tone="accent2" />
              <div className="text-[12.5px] whitespace-nowrap">{people[uid]?.name}</div>
              {canComment && (
                <button onClick={() => removeCc(org.id, project.id, issue.id, uid)} className="text-[11px] text-neutral-600 hover:text-accent-700 cursor-pointer px-0.5">
                  ✕
                </button>
              )}
            </div>
          ))}
          {canComment && ccCandidates.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && addCc(org.id, project.id, issue.id, e.target.value)}
              className="h-7 border border-line rounded-full px-2.5 text-[12.5px] bg-canvas"
            >
              <option value="">+ Cc someone</option>
              {ccCandidates.map((uid) => <option key={uid} value={uid}>{people[uid]?.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600 mb-3">Comments</div>
      <div className="flex flex-col gap-4 mb-4">
        {issue.comments.map((c) => (
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

      {canComment && (
        <div className="flex flex-col gap-2.5 mb-6">
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

      <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600 mb-2.5">Activity</div>
      <div
        className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
            setActivityVisible((v) => Math.min(v + ACTIVITY_PAGE_SIZE, issue.activity.length));
          }
        }}
      >
        {issue.activity.slice(0, activityVisible).map((a) => (
          <div key={a.id} className="flex gap-2.5 items-baseline">
            <div className="w-[7px] h-[7px] rounded-full bg-neutral-400 mt-1.5 flex-none" />
            <div className="flex-1 text-[13px] text-neutral-800 leading-relaxed">{people[a.actor]?.name.split(' ')[0]} {a.text}</div>
            <div className="text-[11.5px] text-neutral-600 flex-none">{timeAgo(a.at)}</div>
          </div>
        ))}
      </div>
    </Drawer>
  );
}
