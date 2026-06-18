import { useEffect, useState } from 'react';
import './DictionaryPanel.css';

interface DictionaryPanelProps {
  onClose: () => void;
}

export default function DictionaryPanel({ onClose }: DictionaryPanelProps) {
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    window.api.listDictionaryWords().then((w) => {
      setWords([...w].sort((a, b) => a.localeCompare(b)));
      setLoading(false);
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  const addWord = async () => {
    const trimmed = newWord.trim();
    if (!trimmed) return;
    await window.api.addDictionaryWord(trimmed);
    setNewWord('');
    refresh();
  };

  const removeWord = async (word: string) => {
    await window.api.removeDictionaryWord(word);
    refresh();
  };

  return (
    <div className="dict-overlay">
      <div className="dict-panel">
        <div className="dict-header">
          <h2>Custom Dictionary</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="dict-hint">
          Words added here won't be flagged as misspelled anywhere in the app &mdash;
          useful for character names, invented words, or place names. You can also
          add a word directly by right-clicking it in the editor and choosing
          "Add to Dictionary."
        </div>

        <div className="dict-add-row">
          <input
            className="dict-input"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addWord(); }}
            placeholder="Add a word..."
          />
          <button className="dict-add-btn" onClick={addWord}>Add</button>
        </div>

        <div className="dict-list">
          {loading && <div className="dict-empty">Loading...</div>}
          {!loading && words.length === 0 && (
            <div className="dict-empty">No custom words yet.</div>
          )}
          {words.map((word) => (
            <div key={word} className="dict-item">
              <span>{word}</span>
              <button className="dict-remove-btn" onClick={() => removeWord(word)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
