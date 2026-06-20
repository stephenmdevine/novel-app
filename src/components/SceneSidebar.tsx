import { useState } from 'react';
import type { Novel, Scene, SceneElements, TodoItem, StoryGridData } from '../types';
import { DEFAULT_SCENE_ELEMENT_LABELS } from '../types';
import SceneTodoList from './SceneTodoList';
import './SceneSidebar.css';

interface SceneSidebarProps {
  novel: Novel;
  scene: Scene;
  onElementsChange: (elements: SceneElements) => void;
  onTodosChange: (todos: TodoItem[]) => void;
  onStoryGridChange: (storyGrid: StoryGridData) => void;
  onJumpToMarker: (markerId: string) => void;
}

type SidebarTab = 'plan' | 'grid';

const POLARITY_OPTIONS: { value: StoryGridData['polarity']; label: string }[] = [
  { value: '',     label: '— select —' },
  { value: '+/-',  label: '+ / −   (Positive → Negative)' },
  { value: '-/+',  label: '− / +   (Negative → Positive)' },
  { value: '+/++', label: '+ / ++  (Positive → Greater Positive)' },
  { value: '-/--', label: '− / −−  (Negative → Greater Negative)' },
];

const TURNING_POINT_OPTIONS: { value: StoryGridData['turningPointType']; label: string }[] = [
  { value: '',           label: '— select —' },
  { value: 'active',     label: 'Active' },
  { value: 'revelatory', label: 'Revelatory' },
];

export default function SceneSidebar({
  novel,
  scene,
  onElementsChange,
  onTodosChange,
  onStoryGridChange,
  onJumpToMarker,
}: SceneSidebarProps) {
  const [tab, setTab] = useState<SidebarTab>('plan');

  const updateElement = (key: keyof SceneElements, value: string) => {
    onElementsChange({ ...scene.elements, [key]: value });
  };

  const grid: StoryGridData = scene.storyGrid ?? {
    valueStart: '', valueEnd: '', polarity: '',
    povCharacter: '', sceneLocation: '', turningPointType: '',
  };

  const updateGrid = (key: keyof StoryGridData, value: string) => {
    onStoryGridChange({ ...grid, [key]: value });
  };

  return (
    <div className="scene-sidebar">

      {/* Tab switcher */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${tab === 'plan' ? 'active' : ''}`}
          onClick={() => setTab('plan')}
        >
          Scene Plan
        </button>
        <button
          className={`sidebar-tab ${tab === 'grid' ? 'active' : ''}`}
          onClick={() => setTab('grid')}
        >
          Story Grid
        </button>
      </div>

      {tab === 'plan' && (
        <>
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
                  onChange={(e) => updateElement(key, e.target.value)}
                  placeholder={`Describe the ${DEFAULT_SCENE_ELEMENT_LABELS[key].toLowerCase()}...`}
                  rows={2}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'grid' && (
        <div className="sidebar-section">
          <h3>Story Grid Data</h3>

          <div className="grid-field-group">
            <div className="grid-group-label">Scene Value</div>
            <div className="element-field">
              <label>Start</label>
              <input
                className="grid-text-input"
                value={grid.valueStart}
                onChange={(e) => updateGrid('valueStart', e.target.value)}
                placeholder="e.g. Alive, Hopeful, Free…"
              />
            </div>
            <div className="element-field">
              <label>End</label>
              <input
                className="grid-text-input"
                value={grid.valueEnd}
                onChange={(e) => updateGrid('valueEnd', e.target.value)}
                placeholder="e.g. Unconscious, Despairing…"
              />
            </div>
            {grid.valueStart && grid.valueEnd && (
              <div className="value-shift-preview">
                {grid.valueStart} <span className="value-shift-arrow">→</span> {grid.valueEnd}
              </div>
            )}
          </div>

          <div className="element-field">
            <label>Polarity</label>
            <select
              className="grid-select"
              value={grid.polarity}
              onChange={(e) => updateGrid('polarity', e.target.value as StoryGridData['polarity'])}
            >
              {POLARITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="element-field">
            <label>Turning Point</label>
            <select
              className="grid-select"
              value={grid.turningPointType}
              onChange={(e) => updateGrid('turningPointType', e.target.value as StoryGridData['turningPointType'])}
            >
              {TURNING_POINT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="element-field">
            <label>POV Character</label>
            <input
              className="grid-text-input"
              value={grid.povCharacter}
              onChange={(e) => updateGrid('povCharacter', e.target.value)}
              placeholder="Character name…"
            />
          </div>

          <div className="element-field">
            <label>Scene Location</label>
            <input
              className="grid-text-input"
              value={grid.sceneLocation}
              onChange={(e) => updateGrid('sceneLocation', e.target.value)}
              placeholder="Where does this scene take place?"
            />
          </div>
        </div>
      )}

      <SceneTodoList
        todos={scene.todos ?? []}
        onChange={onTodosChange}
        onJumpToMarker={onJumpToMarker}
      />
    </div>
  );
}
