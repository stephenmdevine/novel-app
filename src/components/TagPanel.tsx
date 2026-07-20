import { useEffect, useState } from 'react';
import type { Tag, TagType, Scene } from '../types';
import './TagPanel.css';

// Fixed display order for the type accordion — mirrors the <select> option
// order used when creating/reclassifying a tag.
const TAG_TYPE_ORDER: { type: TagType; label: string }[] = [
  { type: 'character', label: 'Character' },
  { type: 'species', label: 'Species' },
  { type: 'location', label: 'Location' },
  { type: 'item', label: 'Item' },
  { type: 'powers', label: 'Powers' },
  { type: 'event', label: 'Event' },
  { type: 'culture', label: 'Culture/Religion' },
  { type: 'faction', label: 'Faction/Organization' },
  { type: 'other', label: 'Other' },
];

interface TagPanelProps {
  tags: Tag[];
  scenes: Scene[];
  onUpdateTag: (tag: Tag) => void;
  onDeleteTag: (tagId: string) => void;
  onClose: () => void;
  onJumpToScene: (sceneId: string) => void;
}

export default function TagPanel({ tags, scenes, onUpdateTag, onDeleteTag, onClose, onJumpToScene }: TagPanelProps) {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(tags[0]?.id ?? null);
  const [addingAttr, setAddingAttr] = useState(false);
  const [newAttrKey, setNewAttrKey] = useState('');
  const selectedTag = tags.find((t) => t.id === selectedTagId) ?? null;

  // Only one type group is expanded at a time. It defaults to whichever
  // type the selected tag belongs to, and re-syncs whenever the selected
  // tag changes — including when the tag itself is reclassified to a new
  // type, so the accordion follows it there automatically.
  const [expandedType, setExpandedType] = useState<TagType | null>(tags[0]?.type ?? null);

  useEffect(() => {
    if (selectedTag) setExpandedType(selectedTag.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTag?.id, selectedTag?.type]);

  const groupedTags = TAG_TYPE_ORDER
    .map(({ type, label }) => ({ type, label, items: tags.filter((t) => t.type === type) }))
    .filter((group) => group.items.length > 0);

  const toggleGroup = (type: TagType) => {
    setExpandedType((prev) => (prev === type ? null : type));
  };

  const selectTag = (tagId: string) => {
    setSelectedTagId(tagId);
    setAddingAttr(false);
    setNewAttrKey('');
  };

  // Find scenes that reference this tag (by data-tag-id in content HTML)
  const referencingScenes = selectedTag
    ? scenes.filter((s) => s.content.includes(`data-tag-id="${selectedTag.id}"`))
    : [];

  const updateName = (name: string) => {
    if (!selectedTag) return;
    onUpdateTag({ ...selectedTag, name });
  };

  const updateAttribute = (key: string, value: string) => {
    if (!selectedTag) return;
    onUpdateTag({ ...selectedTag, attributes: { ...selectedTag.attributes, [key]: value } });
  };

  const updateAttributeScene = (key: string, sceneId: string) => {
    if (!selectedTag) return;
    const attributeScenes = { ...(selectedTag.attributeScenes ?? {}) };
    if (sceneId === '') {
      delete attributeScenes[key];
    } else {
      attributeScenes[key] = sceneId;
    }
    onUpdateTag({ ...selectedTag, attributeScenes });
  };

  const deleteAttribute = (key: string) => {
    if (!selectedTag) return;
    const attributes = { ...selectedTag.attributes };
    const attributeScenes = { ...(selectedTag.attributeScenes ?? {}) };
    delete attributes[key];
    delete attributeScenes[key];
    onUpdateTag({ ...selectedTag, attributes, attributeScenes });
  };

  const commitAddAttribute = () => {
    const key = newAttrKey.trim();
    if (!key || !selectedTag) return;
    onUpdateTag({ ...selectedTag, attributes: { ...selectedTag.attributes, [key]: '' } });
    setNewAttrKey('');
    setAddingAttr(false);
  };

  return (
    <div className="tag-overlay">
      <div className="tag-panel">
        <div className="tag-panel-header">
          <h2>Tags &amp; References</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="tag-panel-body">
          <div className="tag-list-col">
            {groupedTags.map((group) => {
              const isExpanded = expandedType === group.type;
              return (
                <div className="tag-group" key={group.type}>
                  <button
                    type="button"
                    className={`tag-group-header ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleGroup(group.type)}
                  >
                    <span className={`tag-dot tag-${group.type}`} />
                    <span className="tag-group-label">{group.label}</span>
                    <span className="tag-group-count">{group.items.length}</span>
                    <span className="tag-group-chevron">›</span>
                  </button>
                  <div className={`tag-group-body ${isExpanded ? 'expanded' : ''}`}>
                    <div className="tag-group-body-inner">
                      {group.items.map((tag) => (
                        <div
                          key={tag.id}
                          className={`tag-list-item ${tag.id === selectedTagId ? 'active' : ''}`}
                          onClick={() => selectTag(tag.id)}
                        >
                          <span className={`tag-dot tag-${tag.type}`} /> {tag.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {tags.length === 0 && <div className="tag-empty">No tags created yet. Select text in the editor and use "Tag Selection".</div>}
          </div>

          <div className="tag-detail-col">
            {selectedTag ? (
              <>
                <label className="detail-label">Name</label>
                <input
                  className="detail-input"
                  value={selectedTag.name}
                  onChange={(e) => updateName(e.target.value)}
                />
                <div className="detail-hint">
                  Renaming here updates the display everywhere this tag is referenced &mdash;
                  no need to find/replace in scene text.
                </div>

                <label className="detail-label">Type</label>
                <select
                  className="detail-input"
                  value={selectedTag.type}
                  onChange={(e) => onUpdateTag({ ...selectedTag, type: e.target.value as Tag['type'] })}
                >
                  <option value="character">Character</option>
                  <option value="species">Species</option>
                  <option value="location">Location</option>
                  <option value="item">Item</option>
                  <option value="powers">Powers</option>
                  <option value="event">Event</option>
                  <option value="culture">Culture/Religion</option>
                  <option value="faction">Faction/Organization</option>
                  <option value="other">Other</option>
                </select>

                <label className="detail-label">Attributes</label>
                <div className="detail-hint">
                  Record key facts about this entity — age, role, appearance, etc. Pin each attribute to the scene where that fact was established to create a jump link back to the source.
                </div>
                <div className="attribute-list">
                  {Object.entries(selectedTag.attributes).map(([key, value]) => {
                    const pinnedSceneId = selectedTag.attributeScenes?.[key] ?? '';
                    const pinnedScene = scenes.find((s) => s.id === pinnedSceneId) ?? null;
                    return (
                      <div className="attribute-row" key={key}>
                        <div className="attribute-main">
                          <span className="attribute-key">{key}</span>
                          <input
                            className="detail-input attribute-value-input"
                            value={value}
                            onChange={(e) => updateAttribute(key, e.target.value)}
                          />
                          <button
                            className="delete-attr-btn"
                            title="Remove attribute"
                            onClick={() => deleteAttribute(key)}
                          >×</button>
                        </div>
                        <div className="attribute-scene-row">
                          <span className="attribute-scene-label">Established in:</span>
                          <select
                            className="attribute-scene-select"
                            value={pinnedSceneId}
                            onChange={(e) => updateAttributeScene(key, e.target.value)}
                          >
                            <option value="">— none —</option>
                            {scenes.map((s) => (
                              <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                          </select>
                          {pinnedScene && (
                            <button
                              className="attribute-scene-jump"
                              title={`Jump to ${pinnedScene.title}`}
                              onClick={() => onJumpToScene(pinnedScene.id)}
                            >
                              ↗
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {addingAttr ? (
                    <div className="new-attr-form">
                      <input
                        className="detail-input new-attr-input"
                        value={newAttrKey}
                        onChange={(e) => setNewAttrKey(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitAddAttribute();
                          if (e.key === 'Escape') { setAddingAttr(false); setNewAttrKey(''); }
                        }}
                        placeholder="e.g. age, eye color, role…"
                        autoFocus
                      />
                      <button className="tag-form-submit" onClick={commitAddAttribute}>Add</button>
                      <button className="tag-form-cancel" onClick={() => { setAddingAttr(false); setNewAttrKey(''); }}>Cancel</button>
                    </div>
                  ) : (
                    <button className="add-attr-btn" onClick={() => setAddingAttr(true)}>+ Add attribute</button>
                  )}
                </div>

                <label className="detail-label">Referenced in {referencingScenes.length} scene(s)</label>
                <div className="reference-list">
                  {referencingScenes.map((s) => (
                    <div key={s.id} className="reference-item" onClick={() => onJumpToScene(s.id)}>
                      {s.title}
                    </div>
                  ))}
                  {referencingScenes.length === 0 && <div className="tag-empty">No references found.</div>}
                </div>

                <button className="delete-tag-btn" onClick={() => onDeleteTag(selectedTag.id)}>
                  Delete Tag
                </button>
              </>
            ) : (
              <div className="tag-empty">Select a tag to view details.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
