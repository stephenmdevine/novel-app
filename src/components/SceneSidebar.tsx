import { useState } from 'react';
import type { Novel, Scene, SceneElements, TodoItem, StoryGridData } from '../types';
import { DEFAULT_SCENE_ELEMENT_LABELS } from '../types';
import { PLAN_ELEMENT_COLORS } from '../lib/ScenePlanMark';
import SceneTodoList from './SceneTodoList';
import './SceneSidebar.css';

interface SceneSidebarProps {
  novel: Novel;
  scene: Scene;
  planAnchorKeys: Set<string>;
  onElementsChange: (elements: SceneElements) => void;
  onTodosChange: (todos: TodoItem[]) => void;
  onStoryGridChange: (storyGrid: StoryGridData) => void;
  onJumpToMarker: (markerId: string) => void;
  onJumpToPlanMark: (elementKey: string) => void;
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

// The Scene Plan key that corresponds to "Turning Point" in the user's labeling
const TURNING_POINT_PLAN_KEY = 'incitingIncident';

export default function SceneSidebar({
  novel,
  scene,
  planAnchorKeys,
  onElementsChange,
  onTodosChange,
  onStoryGridChange,
  onJumpToMarker,
  onJumpToPlanMark,
}: SceneSidebarProps) {
  const [tab, setTab] = useState<SidebarTab>('plan');

  const updateElement = (key: keyof SceneElements, value: string) => {
    onElementsChange({ ...scene.elements, [key]: value });
  };

  const grid: StoryGridData = scene.storyGrid ?? {
    valueStart: '', valueEnd: '', polarity: '',
    povCharacter: '', sceneLocation: '', period: '', duration: '', turningPointType: '',
  };

  const updateGrid = (key: keyof StoryGridData, value: string) => {
    onStoryGridChange({ ...grid, [key]: value });
  };

  const turningPointAnchored = planAnchorKeys.has(TURNING_POINT_PLAN_KEY);

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
            <p className="sidebar-hint">
              Plan your scene before writing, then select passages and use <strong>¶ Anchor to Plan</strong> in the toolbar to link prose to each element.
            </p>
            {(Object.keys(DEFAULT_SCENE_ELEMENT_LABELS) as Array<keyof SceneElements>).map((key) => {
              const label = DEFAULT_SCENE_ELEMENT_LABELS[key];
              const color = PLAN_ELEMENT_COLORS[key];
              const anchored = planAnchorKeys.has(key);
              return (
                <div className="element-field" key={key}>
                  <div className="element-label-row">
                    <span
                      className="plan-element-swatch"
                      style={{ background: color }}
                      title={`${label} anchor color`}
                    />
                    {anchored ? (
                      <button
                        className="element-label-btn"
                        style={{ color }}
                        onClick={() => onJumpToPlanMark(key)}
                        title={`Jump to anchored ${label} text`}
                      >
                        {label} ↗
                      </button>
                    ) : (
                      <label className="element-label-plain">{label}</label>
                    )}
                  </div>
                  <textarea
                    value={scene.elements[key]}
                    onChange={(e) => updateElement(key, e.target.value)}
                    placeholder={`Notes on the ${label.toLowerCase()}…`}
                    rows={2}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'grid' && (
        <div className="sidebar-section">
          <h3>Story Grid Data</h3>
          <p className="sidebar-hint">
            Fill these fields after drafting to track your scene's narrative function. View all scenes together in the <strong>Story Map</strong>.
          </p>

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
                {grid.valueStart}
                <span className="value-shift-arrow">→</span>
                {grid.valueEnd}
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
            <div className="element-label-row" style={{ marginBottom: 4 }}>
              <span
                className="plan-element-swatch"
                style={{ background: PLAN_ELEMENT_COLORS[TURNING_POINT_PLAN_KEY] }}
              />
              <label style={{ margin: 0 }}>Turning Point</label>
              {turningPointAnchored && (
                <button
                  className="grid-jump-link"
                  onClick={() => onJumpToPlanMark(TURNING_POINT_PLAN_KEY)}
                  title="Jump to anchored Turning Point text"
                >
                  ↗ in scene
                </button>
              )}
            </div>
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

          <div className="element-field">
            <label>Period / Time</label>
            <input
              className="grid-text-input"
              value={grid.period}
              onChange={(e) => updateGrid('period', e.target.value)}
              placeholder="e.g. Dawn, Day 3 · Winter 1842…"
            />
          </div>

          <div className="element-field">
            <label>Duration</label>
            <input
              className="grid-text-input"
              value={grid.duration}
              onChange={(e) => updateGrid('duration', e.target.value)}
              placeholder="e.g. ~20 minutes · 3 days…"
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
