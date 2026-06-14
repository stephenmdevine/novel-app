import { useState } from 'react';
import type { Novel } from '../types';
import './NovelLibrary.css';

interface NovelLibraryProps {
  novels: Novel[];
  onOpen: (novelId: string) => void;
  onCreate: (title: string, genres: string[], theme: string) => void;
  onDelete: (novelId: string) => void;
}

export default function NovelLibrary({ novels, onOpen, onCreate, onDelete }: NovelLibraryProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [genre1, setGenre1] = useState('');
  const [genre2, setGenre2] = useState('');
  const [theme, setTheme] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    const genres = [genre1, genre2].map((g) => g.trim()).filter(Boolean);
    onCreate(title.trim(), genres, theme.trim());
    setTitle(''); setGenre1(''); setGenre2(''); setTheme('');
    setShowForm(false);
  };

  return (
    <div className="novel-library">
      <div className="library-header">
        <h1>Your Novels</h1>
        <button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : '+ New Novel'}</button>
      </div>

      {showForm && (
        <div className="new-novel-form">
          <input placeholder="Novel title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="form-row">
            <input placeholder="Genre 1" value={genre1} onChange={(e) => setGenre1(e.target.value)} />
            <input placeholder="Genre 2 (optional)" value={genre2} onChange={(e) => setGenre2(e.target.value)} />
          </div>
          <input placeholder="Theme" value={theme} onChange={(e) => setTheme(e.target.value)} />
          <button className="create-btn" onClick={submit}>Create Novel</button>
        </div>
      )}

      <div className="novel-grid">
        {novels.map((novel) => (
          <div key={novel.id} className="novel-card" onClick={() => onOpen(novel.id)}>
            <h2>{novel.title}</h2>
            <div className="novel-genres">{novel.genres.join(' / ') || 'No genre set'}</div>
            <div className="novel-theme">{novel.theme || 'No theme set'}</div>
            <button
              className="delete-novel-btn"
              onClick={(e) => { e.stopPropagation(); onDelete(novel.id); }}
            >
              Delete
            </button>
          </div>
        ))}
        {novels.length === 0 && !showForm && (
          <div className="library-empty">No novels yet. Click "+ New Novel" to get started.</div>
        )}
      </div>
    </div>
  );
}
