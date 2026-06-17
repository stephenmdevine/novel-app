import { useEffect, useRef, useState } from 'react';
import type { useFindReplace } from '../lib/useFindReplace';
import './FindReplaceBar.css';

interface FindReplaceBarProps {
  fr: ReturnType<typeof useFindReplace>;
  onClose: () => void;
}

export default function FindReplaceBar({ fr, onClose }: FindReplaceBarProps) {
  const [showReplace, setShowReplace] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) fr.findPrev();
      else fr.findNext();
    }
  };

  const matchLabel = fr.matches.length === 0
    ? (fr.query ? 'No results' : '')
    : `${fr.activeIndex + 1} of ${fr.matches.length}`;

  return (
    <div className="find-replace-bar">
      <div className="find-row">
        <input
          ref={inputRef}
          className="find-input"
          value={fr.query}
          onChange={(e) => fr.setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find in scene..."
        />
        <span className="find-match-label">{matchLabel}</span>
        <button
          className="find-icon-btn"
          onMouseDown={(e) => { e.preventDefault(); fr.findPrev(); }}
          disabled={fr.matches.length === 0}
          title="Previous match (Shift+Enter)"
        >&uarr;</button>
        <button
          className="find-icon-btn"
          onMouseDown={(e) => { e.preventDefault(); fr.findNext(); }}
          disabled={fr.matches.length === 0}
          title="Next match (Enter)"
        >&darr;</button>
        <label className="find-case-toggle">
          <input
            type="checkbox"
            checked={fr.caseSensitive}
            onChange={(e) => fr.setCaseSensitive(e.target.checked)}
          />
          Aa
        </label>
        <button
          className="find-toggle-replace"
          onMouseDown={(e) => { e.preventDefault(); setShowReplace((s) => !s); }}
        >
          {showReplace ? 'Hide Replace' : 'Replace'}
        </button>
        <button className="find-close-btn" onMouseDown={(e) => { e.preventDefault(); onClose(); }}>&times;</button>
      </div>

      {showReplace && (
        <div className="replace-row">
          <input
            className="find-input"
            value={fr.replaceText}
            onChange={(e) => fr.setReplaceText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            placeholder="Replace with..."
          />
          <button
            className="replace-btn"
            onMouseDown={(e) => { e.preventDefault(); fr.replaceCurrent(); }}
            disabled={fr.matches.length === 0}
          >
            Replace
          </button>
          <button
            className="replace-btn replace-all-btn"
            onMouseDown={(e) => { e.preventDefault(); fr.replaceAll(); }}
            disabled={fr.matches.length === 0}
          >
            Replace All
          </button>
        </div>
      )}
    </div>
  );
}
