import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Select, TextArea } from '@/components/ui/Field';
import { useOrg, useProject, usePermissions } from '@/hooks/useScope';
import { useDataStore } from '@/store/dataStore';
import { usePeopleStore } from '@/store/peopleStore';
import { STORE_KIND_LABEL } from '@/data/people';
import { timeAgo } from '@/lib/format';
import type { StoreKind } from '@/types';

export function StoreItemDrawer() {
  const [params, setParams] = useSearchParams();
  const org = useOrg();
  const project = useProject();
  const { canEdit } = usePermissions();
  const updateStoreItem = useDataStore((s) => s.updateStoreItem);
  const deleteStoreItem = useDataStore((s) => s.deleteStoreItem);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [title, setTitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const people = usePeopleStore((s) => s.people);

  const itemId = params.get('store');
  const item = project?.store.find((s) => s.id === itemId);

  const close = () => {
    const next = new URLSearchParams(params);
    next.delete('store');
    setParams(next, { replace: true });
  };

  if (!org || !project || !item) return null;

  const displayTitle = editingTitle ? title : item.title;
  const displayContent = editingContent ? content : item.content;

  return (
    <Drawer
      open
      onClose={close}
      width={520}
      header={
        <>
          <Select
            value={item.kind}
            disabled={!canEdit}
            onChange={(e) => updateStoreItem(org.id, project.id, item.id, { kind: e.target.value as StoreKind }, `changed type to ${STORE_KIND_LABEL[e.target.value]}`)}
            className="h-[30px] w-auto text-xs px-2.5"
          >
            <option value="DOC">Doc</option>
            <option value="ENV">Env file</option>
            <option value="NOTE">Note</option>
            <option value="LINK">Link</option>
          </Select>
          <div className="text-[11.5px] text-neutral-600">updated {timeAgo(item.updatedAt)} by {people[item.updatedBy]?.name.split(' ')[0]}</div>
          {canEdit && (
            <button
              onClick={() => { deleteStoreItem(org.id, project.id, item.id); close(); }}
              className="text-[13px] text-neutral-600 hover:text-accent-700 font-semibold cursor-pointer px-2"
            >
              Delete
            </button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <input
          value={displayTitle}
          disabled={!canEdit}
          onFocus={() => { setEditingTitle(true); setTitle(item.title); setOriginalTitle(item.title); }}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title !== originalTitle && title.trim()) {
              updateStoreItem(org.id, project.id, item.id, { title: title.trim() }, `renamed to ${title.trim()}`);
            }
            setEditingTitle(false);
          }}
          className="font-heading text-[22px] border border-transparent rounded-full px-3 py-1.5 bg-transparent w-full focus:outline-none focus:border-accent focus:bg-canvas"
        />
        <TextArea
          value={displayContent}
          disabled={!canEdit}
          onFocus={() => { setEditingContent(true); setContent(item.content); setOriginalContent(item.content); }}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => {
            if (content !== originalContent) {
              updateStoreItem(org.id, project.id, item.id, { content }, 'edited the content');
            }
            setEditingContent(false);
          }}
          rows={12}
          className="font-mono text-[13.5px] leading-relaxed"
        />
        <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600 mt-2">History</div>
        <div className="flex flex-col gap-1.5">
          {item.history.map((h, idx) => (
            <div key={idx} className="flex gap-2 text-[12.5px]">
              <div className="flex-1 text-neutral-800">{people[h.actor]?.name.split(' ')[0]} {h.text}</div>
              <div className="text-neutral-600">{timeAgo(h.at)}</div>
            </div>
          ))}
          {item.history.length === 0 && <div className="text-[12.5px] text-neutral-600">No changes yet.</div>}
        </div>
      </div>
    </Drawer>
  );
}
