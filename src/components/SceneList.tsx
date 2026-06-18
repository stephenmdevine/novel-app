import { useRef, useState } from 'react';
import type { Scene } from '../types';
import './SceneList.css';

interface SceneListProps {
  scenes: Scene[];
  activeSceneId: string | null;
  onSelect: (sceneId: string) => void;
  onAdd: () => void;
  onDelete: (sceneId: string) => void;
  onRename: (sceneId: string, title: string) => void;
  onReorder: (scenes: Scene[]) => void;
}

export default function SceneList({ scenes, activeSceneId, onSelect, onAdd, onDelete, onRename, onReorder }: SceneListProps) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Minimal ghost — just the scene title text
    e.dataTransfer.setData('text/plain', scenes[index].id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    const reordered = [...scenes];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    // Reassign order values to match new positions
    const withOrder = reordered.map((s, i) => ({ ...s, order: i }));
    onReorder(withOrder);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="scene-list">
      <div className="scene-list-header">
        <h3>Scenes</h3>
        <button onClick={onAdd}>+ New</button>
      </div>
      {scenes.map((scene, index) => (
        <div
          key={scene.id}
          className={[
            'scene-item',
            scene.id === activeSceneId ? 'active' : '',
            dragOverIndex === index ? 'drag-over' : '',
          ].join(' ').trim()}
          onClick={() => onSelect(scene.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <div className="scene-item-inner">
            <span
              className="drag-handle"
              title="Drag to reorder"
              onMouseDown={(e) => e.stopPropagation()}
            >
              ⠿
            </span>
            <div className="scene-item-content">
              <input
                className="scene-title-input"
                value={scene.title}
                onChange={(e) => onRename(scene.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="scene-meta">
                <span>{scene.wordCount} words</span>
                <button
                  className="delete-btn"
                  onClick={(e) => { e.stopPropagation(); onDelete(scene.id); }}
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      {scenes.length === 0 && <div className="scene-list-empty">No scenes yet. Click "+ New" to start.</div>}
    </div>
  );
}
