import { useEffect, useState } from 'react';
import type { Novel, Scene, Tag } from './types';
import { createEmptyNovel, createEmptyScene } from './lib/defaults';
import NovelLibrary from './components/NovelLibrary';
import SceneList from './components/SceneList';
import SceneSidebar from './components/SceneSidebar';
import SceneEditor from './components/SceneEditor';
import ReviewChecklist from './components/ReviewChecklist';
import TagPanel from './components/TagPanel';
import './App.css';

export default function App() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [activeNovelId, setActiveNovelId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [editingNovelInfo, setEditingNovelInfo] = useState(false);

  const activeNovel = novels.find((n) => n.id === activeNovelId) ?? null;
  const activeScene = scenes.find((s) => s.id === activeSceneId) ?? null;

  // ----- Load novels on startup -----
  useEffect(() => {
    window.api.listNovels().then(setNovels);
  }, []);

  // ----- Load scenes & tags when a novel is opened -----
  useEffect(() => {
    if (!activeNovelId) return;
    window.api.listScenes(activeNovelId).then((s) => {
      setScenes(s);
      setActiveSceneId(s[0]?.id ?? null);
    });
    window.api.listTags(activeNovelId).then(setTags);
  }, [activeNovelId]);

  // ----- Novel CRUD -----
  const handleCreateNovel = async (title: string, genres: string[], theme: string) => {
    const novel = createEmptyNovel(title, genres, theme);
    await window.api.createNovel(novel);
    setNovels((prev) => [...prev, novel]);
  };

  const handleDeleteNovel = async (novelId: string) => {
    if (!confirm('Delete this novel and all its scenes? This cannot be undone.')) return;
    await window.api.deleteNovel(novelId);
    setNovels((prev) => prev.filter((n) => n.id !== novelId));
    if (activeNovelId === novelId) setActiveNovelId(null);
  };

  const handleSaveNovelMeta = async (updates: Partial<Novel>) => {
    if (!activeNovel) return;
    const updated = { ...activeNovel, ...updates, updatedAt: new Date().toISOString() };
    await window.api.saveNovel(updated);
    setNovels((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  // ----- Scene CRUD -----
  const handleAddScene = async () => {
    if (!activeNovelId) return;
    const scene = createEmptyScene(scenes.length);
    await window.api.saveScene(activeNovelId, scene);
    setScenes((prev) => [...prev, scene]);
    setActiveSceneId(scene.id);
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!activeNovelId) return;
    if (!confirm('Delete this scene?')) return;
    await window.api.deleteScene(activeNovelId, sceneId);
    setScenes((prev) => prev.filter((s) => s.id !== sceneId));
    if (activeSceneId === sceneId) {
      setActiveSceneId(scenes.find((s) => s.id !== sceneId)?.id ?? null);
    }
  };

  const handleRenameScene = (sceneId: string, title: string) => {
    setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, title } : s)));
    persistScene(sceneId, { title });
  };

  const handleEditorChange = (html: string, wordCount: number) => {
    if (!activeSceneId) return;
    setScenes((prev) =>
      prev.map((s) => (s.id === activeSceneId ? { ...s, content: html, wordCount } : s))
    );
    persistScene(activeSceneId, { content: html, wordCount });
  };

  const handleElementsChange = (elements: Scene['elements']) => {
    if (!activeSceneId) return;
    setScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, elements } : s)));
    persistScene(activeSceneId, { elements });
  };

  const handleReviewStateChange = (reviewState: Record<string, boolean>) => {
    if (!activeSceneId) return;
    setScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, reviewState } : s)));
    persistScene(activeSceneId, { reviewState });
  };

  // Simple direct write per change (JSON file IO is cheap at this scale)
  const persistScene = async (sceneId: string, updates: Partial<Scene>) => {
    if (!activeNovelId) return;
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    const updated = { ...scene, ...updates, updatedAt: new Date().toISOString() };
    await window.api.saveScene(activeNovelId, updated);
  };

  // ----- Tag operations -----
  const handleCreateTag = (name: string, type: Tag['type']): Tag => {
    const tag: Tag = {
      id: crypto.randomUUID(),
      name,
      type,
      attributes: {},
    };
    const updated = [...tags, tag];
    setTags(updated);
    if (activeNovelId) window.api.saveTags(activeNovelId, updated);
    return tag;
  };

  const handleUpdateTag = (tag: Tag) => {
    const updated = tags.map((t) => (t.id === tag.id ? tag : t));
    setTags(updated);
    if (activeNovelId) window.api.saveTags(activeNovelId, updated);
  };

  const handleDeleteTag = (tagId: string) => {
    const updated = tags.filter((t) => t.id !== tagId);
    setTags(updated);
    if (activeNovelId) window.api.saveTags(activeNovelId, updated);
  };

  // ----- Render -----

  if (!activeNovel) {
    return (
      <NovelLibrary
        novels={novels}
        onOpen={setActiveNovelId}
        onCreate={handleCreateNovel}
        onDelete={handleDeleteNovel}
      />
    );
  }

  const totalWordCount = scenes.reduce((sum, s) => sum + s.wordCount, 0);

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="back-btn" onClick={() => setActiveNovelId(null)}>&larr; Library</button>
        <div className="novel-title-block">
          {editingNovelInfo ? (
            <h1 style={{ color: '#aac4ff' }}>{activeNovel.title || 'Untitled'}</h1>
          ) : (
            <h1>{activeNovel.title}</h1>
          )}
          <button className="edit-meta-btn" onClick={() => setEditingNovelInfo((s) => !s)}>
            {editingNovelInfo ? 'Done' : 'Edit title / genres / theme'}
          </button>
        </div>
        <div className="header-actions">
          <span className="total-words">{totalWordCount} total words</span>
          <button onClick={() => setShowTagPanel(true)}>Tags &amp; References</button>
          <button onClick={() => setShowReview(true)} disabled={!activeScene}>
            Review Checklist
          </button>
        </div>
      </header>

      {editingNovelInfo && (
        <div className="novel-meta-editor">
          <label className="theme-label">
            Title
            <input
              value={activeNovel.title}
              onChange={(e) => handleSaveNovelMeta({ title: e.target.value })}
            />
          </label>
          <label>
            Genre 1
            <input
              value={activeNovel.genres[0] ?? ''}
              onChange={(e) => handleSaveNovelMeta({ genres: [e.target.value, activeNovel.genres[1] ?? ''].filter(Boolean) })}
            />
          </label>
          <label>
            Genre 2
            <input
              value={activeNovel.genres[1] ?? ''}
              onChange={(e) => handleSaveNovelMeta({ genres: [activeNovel.genres[0] ?? '', e.target.value].filter(Boolean) })}
            />
          </label>
          <label className="theme-label">
            Theme
            <input
              value={activeNovel.theme}
              onChange={(e) => handleSaveNovelMeta({ theme: e.target.value })}
            />
          </label>
        </div>
      )}

      <div className="app-body">
        <SceneList
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSelect={setActiveSceneId}
          onAdd={handleAddScene}
          onDelete={handleDeleteScene}
          onRename={handleRenameScene}
        />

        {activeScene ? (
          <>
            <div className="editor-area">
              <SceneEditor
                scene={activeScene}
                tags={tags}
                onChange={handleEditorChange}
                onCreateTag={handleCreateTag}
              />
            </div>
            <SceneSidebar novel={activeNovel} scene={activeScene} onElementsChange={handleElementsChange} />
          </>
        ) : (
          <div className="no-scene">Select or create a scene to begin writing.</div>
        )}
      </div>

      {showReview && activeScene && (
        <ReviewChecklist
          novel={activeNovel}
          scene={activeScene}
          onUpdateReviewState={handleReviewStateChange}
          onClose={() => setShowReview(false)}
        />
      )}

      {showTagPanel && (
        <TagPanel
          tags={tags}
          scenes={scenes}
          onUpdateTag={handleUpdateTag}
          onDeleteTag={handleDeleteTag}
          onClose={() => setShowTagPanel(false)}
          onJumpToScene={(sceneId) => { setActiveSceneId(sceneId); setShowTagPanel(false); }}
        />
      )}
    </div>
  );
}
