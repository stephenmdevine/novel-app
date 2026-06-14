import type { Novel, Scene, SceneElements } from '../types';
import { DEFAULT_SCENE_ELEMENT_LABELS } from '../types';
import './SceneSidebar.css';

interface SceneSidebarProps {
  novel: Novel;
  scene: Scene;
  onElementsChange: (elements: SceneElements) => void;
}

export default function SceneSidebar({ novel, scene, onElementsChange }: SceneSidebarProps) {
  const update = (key: keyof SceneElements, value: string) => {
    onElementsChange({ ...scene.elements, [key]: value });
  };

  return (
    <div className="scene-sidebar">
      <div className="sidebar-section">
        <h3>Novel Context</h3>
        <div className="context-row">
          <span className="context-label">Genre</span>
          <span className="context-value">{novel.genres.join(', ') || '—'}</span>
        </div>
        <div className="context-row">
          <span className="context-label">Theme</span>
          <span className="context-value">{novel.theme || '—'}</span>
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Scene Plan</h3>
        {(Object.keys(DEFAULT_SCENE_ELEMENT_LABELS) as Array<keyof SceneElements>).map((key) => (
          <div className="element-field" key={key}>
            <label>{DEFAULT_SCENE_ELEMENT_LABELS[key]}</label>
            <textarea
              value={scene.elements[key]}
              onChange={(e) => update(key, e.target.value)}
              placeholder={`Describe the ${DEFAULT_SCENE_ELEMENT_LABELS[key].toLowerCase()}...`}
              rows={2}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
