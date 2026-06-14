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

  const addAttribute = () => {
    if (!selectedTag) return;
    const key = prompt('Attribute name (e.g. age, role, eye color):');
    if (!key) return;
    onUpdateTag({ ...selectedTag, attributes: { ...selectedTag.attributes, [key]: '' } });
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
                onClick={() => setSelectedTagId(tag.id)}
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
                  {Object.entries(selectedTag.attributes).map(([key, value]) => (
                    <div className="attribute-row" key={key}>
                      <span className="attribute-key">{key}</span>
                      <input
                        className="detail-input"
                        value={value}
                        onChange={(e) => updateAttribute(key, e.target.value)}
                      />
                    </div>
                  ))}
                  <button className="add-attr-btn" onClick={addAttribute}>+ Add attribute</button>
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
