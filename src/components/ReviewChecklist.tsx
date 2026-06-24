import { useState } from 'react';
import type { Novel, Scene } from '../types';
import './ReviewChecklist.css';

interface ReviewChecklistProps {
  novel: Novel;
  scene: Scene;
  onUpdateReviewState: (reviewState: Record<string, boolean>) => void;
  onClose: () => void;
}

export default function ReviewChecklist({ novel, scene, onUpdateReviewState, onClose }: ReviewChecklistProps) {
  const items = novel.reviewChecklist;
  const [index, setIndex] = useState(0);
  const current = items[index];
  const checked = scene.reviewState[current?.id] ?? false;

  const completedCount = items.filter((i) => scene.reviewState[i.id]).length;

  const toggle = (value: boolean) => {
    onUpdateReviewState({ ...scene.reviewState, [current.id]: value });
  };

  const next = () => setIndex((i) => Math.min(i + 1, items.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  return (
    <div className="review-overlay">
      <div className="review-panel">
        <div className="review-header">
          <h2>Scene Review &mdash; {scene.title}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="review-progress">
          {completedCount} / {items.length} reviewed
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(completedCount / items.length) * 100}%` }} />
          </div>
        </div>

        <p className="review-intro">
          Work through each item and check it off when satisfied. Click the dots at the bottom to jump to any item directly.
        </p>

        <div className="review-step">
          <div className="step-counter">Item {index + 1} of {items.length}</div>
          <div className="step-question">{current.label}</div>

          <label className="step-checkbox">
            <input type="checkbox" checked={checked} onChange={(e) => toggle(e.target.checked)} />
            Addressed / confirmed
          </label>
        </div>

        <div className="review-nav">
          <button onClick={prev} disabled={index === 0}>&larr; Previous</button>
          <div className="review-dots">
            {items.map((item, i) => (
              <span
                key={item.id}
                className={`review-dot ${scene.reviewState[item.id] ? 'done' : ''} ${i === index ? 'current' : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button onClick={next} disabled={index === items.length - 1}>Next &rarr;</button>
        </div>
      </div>
    </div>
  );
}
