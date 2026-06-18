import { useState } from 'react';
import type { Tag, Scene } from '../types';
import './TagPanel.css';

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
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={`tag-list-item ${tag.id === selectedTagId ? 'active' : ''}`}
                onClick={() => { setSelectedTagId(tag.id); setAddingAttr(false); setNewAttrKey(''); }}
              >
                <span className={`tag-dot tag-${tag.type}`} /> {tag.name}
              </div>
            ))}
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
                  <option value="location">Location</option>
                  <option value="item">Item</option>
                  <option value="other">Other</option>
                </select>

                <label className="detail-label">Attributes</label>
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
