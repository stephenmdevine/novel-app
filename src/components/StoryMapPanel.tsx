import { useState } from 'react';
import type { Scene, StoryGridData } from '../types';
import './StoryMapPanel.css';

interface StoryMapPanelProps {
  scenes: Scene[];
  onJumpToScene: (sceneId: string) => void;
  onClose: () => void;
}

type MapTab = 'table' | 'arc';

// ---- Polarity metadata ----
const POLARITY_META: Record<string, { label: string; color: string; startY: number; endY: number }> = {
  '+/-':  { label: '+ / −',  color: '#ff7043', startY: 30, endY: 70 },
  '-/+':  { label: '− / +',  color: '#42a5f5', startY: 70, endY: 30 },
  '+/++': { label: '+ / ++', color: '#66bb6a', startY: 30, endY: 10 },
  '-/--': { label: '− / −−', color: '#ef5350', startY: 70, endY: 90 },
};

const TURNING_POINT_LABELS: Record<string, string> = {
  active:     'Active',
  revelatory: 'Revelatory',
};

function emptyGrid(): StoryGridData {
  return { valueStart: '', valueEnd: '', polarity: '', povCharacter: '', sceneLocation: '', turningPointType: '' };
}

function completeness(g: StoryGridData): 'full' | 'partial' | 'empty' {
  const fields = [g.valueStart, g.valueEnd, g.polarity, g.povCharacter, g.sceneLocation, g.turningPointType];
  const filled = fields.filter(Boolean).length;
  if (filled === 0) return 'empty';
  if (filled === fields.length) return 'full';
  return 'partial';
}

// ---- Table view ----
function GridTable({ scenes, onJumpToScene }: { scenes: Scene[]; onJumpToScene: (id: string) => void }) {
  if (scenes.length === 0) {
    return <div className="story-map-empty">No scenes yet.</div>;
  }

  return (
    <div className="story-table-wrap">
      <table className="story-table">
        <thead>
          <tr>
            <th className="col-num">#</th>
            <th className="col-title">Scene</th>
            <th className="col-pov">POV</th>
            <th className="col-loc">Location</th>
            <th className="col-value">Value Shift</th>
            <th className="col-polarity">Polarity</th>
            <th className="col-tp">Turning Point</th>
            <th className="col-status" title="Data completeness" />
          </tr>
        </thead>
        <tbody>
          {scenes.map((scene, i) => {
            const g = scene.storyGrid ?? emptyGrid();
            const status = completeness(g);
            const meta = POLARITY_META[g.polarity];
            return (
              <tr
                key={scene.id}
                className="story-table-row"
                onClick={() => onJumpToScene(scene.id)}
                title="Click to open this scene"
              >
                <td className="col-num cell-muted">{i + 1}</td>
                <td className="col-title cell-title">{scene.title}</td>
                <td className="col-pov">{g.povCharacter || <span className="cell-empty">—</span>}</td>
                <td className="col-loc">{g.sceneLocation || <span className="cell-empty">—</span>}</td>
                <td className="col-value">
                  {g.valueStart || g.valueEnd ? (
                    <span className="value-shift-cell">
                      <span className="vs-start">{g.valueStart || '?'}</span>
                      <span className="vs-arrow">→</span>
                      <span className="vs-end">{g.valueEnd || '?'}</span>
                    </span>
                  ) : (
                    <span className="cell-empty">—</span>
                  )}
                </td>
                <td className="col-polarity">
                  {meta ? (
                    <span className="polarity-badge" style={{ background: meta.color + '33', color: meta.color, borderColor: meta.color + '66' }}>
                      {meta.label}
                    </span>
                  ) : (
                    <span className="cell-empty">—</span>
                  )}
                </td>
                <td className="col-tp">
                  {g.turningPointType ? (
                    <span className="tp-badge">{TURNING_POINT_LABELS[g.turningPointType]}</span>
                  ) : (
                    <span className="cell-empty">—</span>
                  )}
                </td>
                <td className="col-status">
                  {status === 'full' && <span className="status-dot status-full" title="Complete" />}
                  {status === 'partial' && <span className="status-dot status-partial" title="Incomplete" />}
                  {status === 'empty' && <span className="status-dot status-empty" title="No data" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---- Polarity Arc view ----

const SVG_W = 1000;
const SVG_H = 120;
const Y_PAD = 12;
const Y_RANGE = SVG_H - Y_PAD * 2; // usable height

function yPos(val: number) {
  // val is 0–100 where 0=most positive (top), 100=most negative (bottom)
  return Y_PAD + (val / 100) * Y_RANGE;
}

function PolarityArc({ scenes, onJumpToScene }: { scenes: Scene[]; onJumpToScene: (id: string) => void }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (scenes.length === 0) {
    return <div className="story-map-empty">No scenes yet.</div>;
  }

  const N = scenes.length;
  const BLOCK_W = SVG_W / N;

  // Build SVG points: one segment per scene (startX→endX), connected between scenes
  type Point = { x: number; y: number };
  const segments: { start: Point; end: Point; color: string; sceneId: string }[] = [];
  const connectors: { from: Point; to: Point }[] = [];

  scenes.forEach((scene, i) => {
    const g = scene.storyGrid ?? emptyGrid();
    const meta = POLARITY_META[g.polarity];
    const startY = meta ? meta.startY : 50;
    const endY = meta ? meta.endY : 50;
    const color = meta ? meta.color : '#555';

    const sx = i * BLOCK_W + BLOCK_W * 0.15;
    const ex = i * BLOCK_W + BLOCK_W * 0.85;

    const start: Point = { x: sx, y: yPos(startY) };
    const end: Point = { x: ex, y: yPos(endY) };
    segments.push({ start, end, color, sceneId: scene.id });

    if (i > 0) {
      const prev = segments[i - 1];
      connectors.push({ from: prev.end, to: start });
    }
  });

  const neutralY = yPos(50);

  return (
    <div className="arc-outer">
      {/* Y-axis labels */}
      <div className="arc-y-labels">
        <span>+</span>
        <span className="arc-y-mid">0</span>
        <span>−</span>
      </div>

      {/* Scrollable chart + blocks */}
      <div className="arc-scroll">
        {/* SVG chart */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="arc-svg"
          style={{ minWidth: Math.max(600, N * 90) }}
          preserveAspectRatio="none"
        >
          {/* Neutral midline */}
          <line
            x1={0} y1={neutralY} x2={SVG_W} y2={neutralY}
            stroke="#3a3a3a" strokeWidth={1} strokeDasharray="4 4"
          />

          {/* Between-scene connectors */}
          {connectors.map((c, i) => (
            <line
              key={i}
              x1={c.from.x} y1={c.from.y}
              x2={c.to.x} y2={c.to.y}
              stroke="#555" strokeWidth={1.5} strokeDasharray="3 3"
            />
          ))}

          {/* Scene segments */}
          {segments.map((seg, i) => {
            const scene = scenes[i];
            const isHovered = hoveredId === scene.id;
            return (
              <g key={scene.id}>
                <line
                  x1={seg.start.x} y1={seg.start.y}
                  x2={seg.end.x} y2={seg.end.y}
                  stroke={seg.color}
                  strokeWidth={isHovered ? 4 : 2.5}
                  strokeLinecap="round"
                />
                {/* Start dot */}
                <circle cx={seg.start.x} cy={seg.start.y} r={isHovered ? 5 : 3.5} fill={seg.color} />
                {/* End dot */}
                <circle cx={seg.end.x} cy={seg.end.y} r={isHovered ? 5 : 3.5} fill={seg.color} />
                {/* Invisible hit area */}
                <line
                  x1={seg.start.x} y1={seg.start.y}
                  x2={seg.end.x} y2={seg.end.y}
                  stroke="transparent" strokeWidth={20}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredId(scene.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onJumpToScene(scene.id)}
                />
              </g>
            );
          })}
        </svg>

        {/* Scene blocks below the chart */}
        <div className="arc-blocks" style={{ minWidth: Math.max(600, N * 90) }}>
          {scenes.map((scene, i) => {
            const g = scene.storyGrid ?? emptyGrid();
            const meta = POLARITY_META[g.polarity];
            const isHovered = hoveredId === scene.id;
            return (
              <div
                key={scene.id}
                className={`arc-block ${isHovered ? 'hovered' : ''}`}
                style={{ borderTopColor: meta ? meta.color : '#3a3a3a' }}
                onClick={() => onJumpToScene(scene.id)}
                onMouseEnter={() => setHoveredId(scene.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="arc-block-num">{i + 1}</div>
                <div className="arc-block-title">{scene.title}</div>
                {(g.valueStart || g.valueEnd) && (
                  <div className="arc-block-shift">
                    {g.valueStart || '?'} → {g.valueEnd || '?'}
                  </div>
                )}
                {meta && (
                  <div className="arc-block-polarity" style={{ color: meta.color }}>
                    {meta.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- Main panel ----
export default function StoryMapPanel({ scenes, onJumpToScene, onClose }: StoryMapPanelProps) {
  const [tab, setTab] = useState<MapTab>('table');

  const sorted = [...scenes].sort((a, b) => a.order - b.order);

  return (
    <div className="story-map-overlay">
      <div className="story-map-panel">
        <div className="story-map-header">
          <div className="story-map-title-row">
            <h2>Story Map</h2>
            <div className="story-map-tabs">
              <button
                className={`story-map-tab ${tab === 'table' ? 'active' : ''}`}
                onClick={() => setTab('table')}
              >
                Grid Table
              </button>
              <button
                className={`story-map-tab ${tab === 'arc' ? 'active' : ''}`}
                onClick={() => setTab('arc')}
              >
                Polarity Arc
              </button>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="story-map-body">
          {tab === 'table' && (
            <GridTable scenes={sorted} onJumpToScene={(id) => { onJumpToScene(id); onClose(); }} />
          )}
          {tab === 'arc' && (
            <PolarityArc scenes={sorted} onJumpToScene={(id) => { onJumpToScene(id); onClose(); }} />
          )}
        </div>
      </div>
    </div>
  );
}
