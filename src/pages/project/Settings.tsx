import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useOrg, useProject, usePermissions, useMe } from '@/hooks/useScope';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDataStore } from '@/store/dataStore';
import { usePeopleStore } from '@/store/peopleStore';
import { isOrgAdmin as checkOrgAdmin } from '@/lib/permissions';
import type { ProjectRole, Status, TaskField } from '@/types';
import clsx from 'clsx';

interface StatusDraft { name: string; }
interface FieldDraft { enabled: boolean; required: boolean; }

function seedStatusDrafts(statuses: Status[]): Record<string, StatusDraft> {
  return Object.fromEntries(statuses.map((s) => [s.id, { name: s.name }]));
}
function seedFieldDrafts(fields: TaskField[]): Record<string, FieldDraft> {
  return Object.fromEntries(fields.map((f) => [f.id, { enabled: f.enabled, required: f.required }]));
}

export default function Settings() {
  const org = useOrg();
  const project = useProject();
  const me = useMe();
  const { canEdit, isManager: canArchive } = usePermissions();
  const navigate = useNavigate();
  const renameStatus = useDataStore((s) => s.renameStatus);
  const moveStatus = useDataStore((s) => s.moveStatus);
  const addStatus = useDataStore((s) => s.addStatus);
  const deleteStatus = useDataStore((s) => s.deleteStatus);
  const updateTaskField = useDataStore((s) => s.updateTaskField);
  const updateSprintLength = useDataStore((s) => s.updateSprintLength);
  const addProjectMember = useDataStore((s) => s.addProjectMember);
  const updateProjectMemberRole = useDataStore((s) => s.updateProjectMemberRole);
  const removeProjectMember = useDataStore((s) => s.removeProjectMember);
  const toggleArchiveProject = useDataStore((s) => s.toggleArchiveProject);
  const people = usePeopleStore((s) => s.people);

  const [statusDrafts, setStatusDrafts] = useState<Record<string, StatusDraft>>({});
  const [fieldDrafts, setFieldDrafts] = useState<Record<string, FieldDraft>>({});
  const [seededIds, setSeededIds] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!org || !project) return null;

  const addableMembers = org.members.filter((m) => !project.members.some((pm) => pm.userId === m.userId));

  // Re-seed the drafts whenever a column is added/removed/reordered elsewhere,
  // following the drawer's "adjusting state during render" pattern — rename
  // edits and field toggles only reach the server once Save is clicked below.
  const idsKey = `${project.statuses.map((s) => s.id).join(',')}|${project.taskFields.map((f) => f.id).join(',')}`;
  if (idsKey !== seededIds) {
    setSeededIds(idsKey);
    setStatusDrafts(seedStatusDrafts(project.statuses));
    setFieldDrafts(seedFieldDrafts(project.taskFields));
  }

  const statusChanges = project.statuses.filter((s) => statusDrafts[s.id]?.name !== s.name);
  const fieldChanges = project.taskFields.filter((f) => {
    const d = fieldDrafts[f.id];
    return d && (d.enabled !== f.enabled || d.required !== f.required);
  });
  const dirty = statusChanges.length > 0 || fieldChanges.length > 0;

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const s of statusChanges) await renameStatus(org.id, project.id, s.id, statusDrafts[s.id].name);
      for (const f of fieldChanges) await updateTaskField(org.id, project.id, f.id, fieldDrafts[f.id] as Partial<TaskField>);
    } finally {
      setSaving(false);
      setSeededIds(null);
    }
  };

  const discardSettings = () => {
    setStatusDrafts(seedStatusDrafts(project.statuses));
    setFieldDrafts(seedFieldDrafts(project.taskFields));
  };

  return (
    <div className="flex flex-col gap-4 max-w-[820px]">
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-canvas/95 backdrop-blur flex items-center gap-2 border-b border-line">
        <Button variant="primary" size="sm" onClick={saveSettings} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        <Button variant="secondary" size="sm" onClick={discardSettings} disabled={!dirty || saving}>Discard</Button>
        {dirty && <span className="text-[12px] text-neutral-600">Unsaved changes</span>}
      </div>

      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center px-4 sm:px-6 pt-4 pb-3">
          <div className="flex-1 font-heading text-xl">Board columns</div>
          {canEdit && <Button variant="secondary" size="sm" onClick={() => addStatus(org.id, project.id)}>Add column</Button>}
        </div>
        {project.statuses.map((st, idx) => {
          const count = project.issues.filter((i) => i.statusId === st.id).length;
          const blocked = count > 0 || !canEdit;
          return (
            <div key={st.id} className="flex flex-wrap items-center gap-2.5 px-4 sm:px-6 py-2.5 border-t border-line">
              <div className="w-5 text-[12.5px] text-neutral-600">{idx + 1}</div>
              <input
                value={statusDrafts[st.id]?.name ?? st.name}
                disabled={!canEdit}
                onChange={(e) => setStatusDrafts((prev) => ({ ...prev, [st.id]: { name: e.target.value } }))}
                className="flex-1 min-w-[100px] h-9 border border-transparent rounded-full px-3 text-sm bg-transparent focus:outline-none focus:border-accent focus:bg-canvas"
              />
              <div className="hidden sm:block px-2.5 py-0.5 rounded-full bg-canvas text-neutral-600 text-[10.5px] font-semibold tracking-wider uppercase">{st.category.replace('_', ' ')}</div>
              <div className="hidden sm:block w-[66px] text-right text-[12.5px] text-neutral-600">{count} {count === 1 ? 'issue' : 'issues'}</div>
              <button disabled={idx === 0 || !canEdit} onClick={() => moveStatus(org.id, project.id, st.id, 'up')} className="text-sm text-neutral-600 hover:text-accent-700 disabled:opacity-30 cursor-pointer px-1.5 py-1">↑</button>
              <button disabled={idx === project.statuses.length - 1 || !canEdit} onClick={() => moveStatus(org.id, project.id, st.id, 'down')} className="text-sm text-neutral-600 hover:text-accent-700 disabled:opacity-30 cursor-pointer px-1.5 py-1">↓</button>
              <button
                disabled={blocked}
                title={count > 0 ? `Move its ${count} issues first` : 'Delete this column'}
                onClick={() => deleteStatus(org.id, project.id, st.id)}
                className={clsx('text-[13px] font-semibold px-2 py-1', blocked ? 'text-neutral-400 cursor-not-allowed' : 'text-neutral-600 cursor-pointer hover:text-accent-700')}
              >
                Delete
              </button>
            </div>
          );
        })}
        <div className="px-4 sm:px-6 py-3 border-t border-line text-[12.5px] text-neutral-600 leading-relaxed">
          A rename keeps the column's category, so every "is it finished?" query keeps working. Deleting a column with issues in it needs somewhere to move them.
        </div>
      </div>

      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 pt-4 pb-3">
          <div className="font-heading text-xl">Issue form fields</div>
          <div className="text-[12.5px] text-neutral-600 mt-0.5">Which fields appear on "New issue" for this project, and which are required.</div>
        </div>
        <div className="flex items-center gap-2.5 px-4 sm:px-6 py-1.5 text-[10.5px] font-semibold tracking-wider uppercase text-neutral-600">
          <div className="flex-1">Field</div>
          <div className="w-[90px]">Shown</div>
          <div className="w-[90px]">Required</div>
        </div>
        {project.taskFields.map((f) => (
          <div key={f.id} className="flex items-center gap-2.5 px-4 sm:px-6 py-2.5 border-t border-line">
            <div className="flex-1 text-sm">{f.label}</div>
            <div className="w-[90px]">
              <input
                type="checkbox" checked={fieldDrafts[f.id]?.enabled ?? f.enabled} disabled={!canEdit}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setFieldDrafts((prev) => ({ ...prev, [f.id]: { enabled, required: enabled ? (prev[f.id]?.required ?? f.required) : false } }));
                }}
                className="w-[18px] h-[18px] accent-accent cursor-pointer"
              />
            </div>
            <div className="w-[90px]">
              <input
                type="checkbox" checked={fieldDrafts[f.id]?.required ?? f.required} disabled={!canEdit || !(fieldDrafts[f.id]?.enabled ?? f.enabled)}
                onChange={(e) => setFieldDrafts((prev) => ({ ...prev, [f.id]: { enabled: prev[f.id]?.enabled ?? f.enabled, required: e.target.checked } }))}
                className="w-[18px] h-[18px] accent-accent2 cursor-pointer"
              />
            </div>
          </div>
        ))}
        <div className="px-4 sm:px-6 py-3 border-t border-line text-[12.5px] text-neutral-600 leading-relaxed">
          Title and status are always on the form. A field must be shown before it can be required; unchecking "Shown" clears "Required" too.
        </div>
      </div>

      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 pt-4 pb-3">
          <div className="font-heading text-xl">Sprint timing</div>
          <div className="text-[12.5px] text-neutral-600 mt-0.5">Default length for a newly created sprint — start and end dates can still be edited per sprint.</div>
        </div>
        <div className="flex items-center gap-3 px-4 sm:px-6 pb-4">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">Length</div>
          <Select
            value={project.sprintConfig.lengthWeeks}
            disabled={!canEdit}
            onChange={(e) => updateSprintLength(org.id, project.id, Number(e.target.value))}
            className="w-auto h-9 text-[13px]"
          >
            <option value={1}>1 week</option>
            <option value={2}>2 weeks</option>
            <option value={3}>3 weeks</option>
            <option value={4}>4 weeks</option>
          </Select>
        </div>
      </div>

      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 sm:px-6 pt-4 pb-3">
          <div className="flex-1 min-w-[200px]">
            <div className="font-heading text-xl">Project access</div>
            <div className="text-[12.5px] text-neutral-600 mt-0.5">Who can see and work this project — a subset of the organization's members.</div>
          </div>
          {canEdit && (
            <select
              value=""
              onChange={(e) => { if (e.target.value) addProjectMember(org.id, project.id, e.target.value); }}
              className="h-9 border border-line rounded-full px-3.5 text-[13px] bg-canvas"
            >
              <option value="">Add a member…</option>
              {addableMembers.map((m) => <option key={m.userId} value={m.userId}>{people[m.userId]?.name}</option>)}
            </select>
          )}
        </div>
        {project.members.map((m) => {
          const person = people[m.userId];
          const orgAdmin = checkOrgAdmin(org, m.userId);
          const editable = canEdit && !orgAdmin;
          const removable = canEdit && !orgAdmin && m.userId !== me;
          return (
            <div key={m.userId} className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-t border-line">
              <Avatar userId={m.userId} />
              <div className="flex-1 min-w-[120px]">
                <div className="text-sm font-semibold">{person?.name}</div>
                <div className="text-xs text-neutral-600">{person?.email}</div>
              </div>
              {editable ? (
                <Select
                  value={m.role}
                  onChange={(e) => updateProjectMemberRole(org.id, project.id, m.userId, e.target.value as ProjectRole)}
                  className="h-[34px] w-auto text-[13px]"
                >
                  <option value="LEAD">Lead</option>
                  <option value="CONTRIBUTOR">Contributor</option>
                  <option value="VIEWER">Viewer</option>
                </Select>
              ) : (
                <div title={orgAdmin ? 'Org admins are implicitly Lead on every project' : undefined} className="px-3 py-1.5 rounded-full bg-neutral-200 text-neutral-700 text-[12.5px] font-semibold">
                  {orgAdmin ? 'Lead · org admin' : m.role.charAt(0) + m.role.slice(1).toLowerCase()}
                </div>
              )}
              {removable && (
                <button onClick={() => removeProjectMember(org.id, project.id, m.userId)} className="text-[13px] text-neutral-600 hover:text-accent-700 font-semibold cursor-pointer px-2">
                  Remove
                </button>
              )}
            </div>
          );
        })}
        {project.members.length === 0 && <EmptyState>No one has access to this project yet.</EmptyState>}
        <div className="px-4 sm:px-6 py-3 border-t border-line text-[12.5px] text-neutral-600 leading-relaxed">
          Org owners and admins are implicitly Lead on every project — this list is everyone else's explicit grant. A project role can never exceed what the org role already permits.
        </div>
      </div>

      {canArchive && (
        <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm border border-accent/30">
          <div className="px-4 sm:px-6 pt-4 pb-3 font-heading text-xl text-accent-700">Danger zone</div>
          <div className="flex flex-wrap items-center gap-4 px-4 sm:px-6 py-4 border-t border-line">
            <div className="flex-1 text-[12.5px] text-neutral-600 leading-relaxed">
              {project.archived ? 'Unarchiving brings this project back into the active list for everyone with access.' : 'Archiving hides this project from the active list. Nothing is deleted, and it can be brought back at any time.'}
            </div>
            <Button
              variant="danger"
              onClick={() => {
                const wasArchived = project.archived;
                toggleArchiveProject(org.id, project.id);
                if (!wasArchived) navigate(`/o/${org.slug}/projects`);
              }}
            >
              {project.archived ? 'Unarchive project' : 'Archive project'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
