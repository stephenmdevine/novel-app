import type { Scene } from '../types';
import './SceneList.css';

interface SceneListProps {
  scenes: Scene[];
  activeSceneId: string | null;
  onSelect: (sceneId: string) => void;
  onAdd: () => void;
  onDelete: (sceneId: string) => void;
  onRename: (sceneId: string, title: string) => void;
}

export default function SceneList({ scenes, activeSceneId, onSelect, onAdd, onDelete, onRename }: SceneListProps) {
  return (
    <div className="scene-list">
      <div className="scene-list-header">
        <h3>Scenes</h3>
        <button onClick={onAdd}>+ New</button>
      </div>
      {scenes.map((scene) => (
        <div
          key={scene.id}
          className={`scene-item ${scene.id === activeSceneId ? 'active' : ''}`}
          onClick={() => onSelect(scene.id)}
        >
          <input
            className="scene-title-input"
            value={scene.title}
            onChange={(e) => onRename(scene.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="scene-meta">
            <span>{scene.wordCount} words</span>
            <button className="delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(scene.id); }}>
              &times;
            </button>
          </div>
        </div>
      ))}
      {scenes.length === 0 && <div className="scene-list-empty">No scenes yet. Click "+ New" to start.</div>}
    </div>
  );
}
