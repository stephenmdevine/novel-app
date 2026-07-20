import { useEffect, useState } from 'react';
import type { Novel, Scene, Tag, TodoItem } from './types';
import { createEmptyNovel, createEmptyScene } from './lib/defaults';
import NovelLibrary from './components/NovelLibrary';
import SceneList from './components/SceneList';
import SceneSidebar from './components/SceneSidebar';
import SceneEditor from './components/SceneEditor';
import ReviewChecklist from './components/ReviewChecklist';
import TagPanel from './components/TagPanel';
import DictionaryPanel from './components/DictionaryPanel';
import StoryMapPanel from './components/StoryMapPanel';
import HelpModal from './components/HelpModal';
import ConfirmDialog from './components/ConfirmDialog';
import ToastContainer from './components/ToastContainer';
import type { ToastItem } from './components/ToastContainer';
import './App.css';

export default function App() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [activeNovelId, setActiveNovelId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [showStoryMap, setShowStoryMap] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editingNovelInfo, setEditingNovelInfo] = useState(false);
  const [mustEditJumpId, setMustEditJumpId] = useState<string | null>(null);
  const [planJumpKey, setPlanJumpKey] = useState<string | null>(null);
  const [planAnchorKeys, setPlanAnchorKeys] = useState<Set<string>>(new Set());

  // ----- Confirm dialog + toast state (added for release polish) -----
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showError = (message: string) => {
    setToasts((prev) => [...prev, { id: crypto.randomUUID(), message }]);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const activeNovel = novels.find((n) => n.id === activeNovelId) ?? null;
  const activeScene = scenes.find((s) => s.id === activeSceneId) ?? null;

  useEffect(() => {
    window.api.listNovels().then(setNovels).catch(() => {
      showError('Failed to load novels.');
    });
  }, []);

  useEffect(() => {
    if (!activeNovelId) return;
    window.api.listScenes(activeNovelId).then((s) => {
      setScenes(s);
      setActiveSceneId(s[0]?.id ?? null);
      syncNovelStats(s);
      setPlanAnchorKeys(new Set());
    }).catch(() => {
      showError('Failed to load scenes for this novel.');
    });
    window.api.listTags(activeNovelId).then(setTags).catch(() => {
      showError('Failed to load tags for this novel.');
    });
  }, [activeNovelId]);

  // ----- Novel CRUD -----
  const handleCreateNovel = async (title: string, genres: string[], theme: string) => {
    const novel = createEmptyNovel(title, genres, theme);
    try {
      await window.api.createNovel(novel);
      setNovels((prev) => [...prev, novel]);
    } catch {
      showError('Failed to create novel. Please try again.');
    }
  };

  const handleDeleteNovel = (novelId: string) => {
    setConfirmState({
      title: 'Delete novel?',
      message: 'This will permanently delete this novel and all its scenes. This cannot be undone.',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await window.api.deleteNovel(novelId);
          setNovels((prev) => prev.filter((n) => n.id !== novelId));
          if (activeNovelId === novelId) setActiveNovelId(null);
        } catch {
          showError('Failed to delete novel. Please try again.');
        }
      },
    });
  };

  const handleSaveNovelMeta = async (updates: Partial<Novel>) => {
    if (!activeNovel) return;
    const updated = { ...activeNovel, ...updates, updatedAt: new Date().toISOString() };
    try {
      await window.api.saveNovel(updated);
      setNovels((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch {
      showError('Failed to save novel details.');
    }
  };

  // ----- Scene CRUD -----
  const handleAddScene = async () => {
    if (!activeNovelId) return;
    const scene = createEmptyScene(scenes.length);
    try {
      await window.api.saveScene(activeNovelId, scene);
      setScenes((prev) => {
        const updated = [...prev, scene];
        syncNovelStats(updated);
        return updated;
      });
      setActiveSceneId(scene.id);
    } catch {
      showError('Failed to create scene. Please try again.');
    }
  };

  const handleDeleteScene = (sceneId: string) => {
    if (!activeNovelId) return;
    setConfirmState({
      title: 'Delete scene?',
      message: 'This scene will be permanently deleted. This cannot be undone.',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await window.api.deleteScene(activeNovelId, sceneId);
          setScenes((prev) => {
            const updated = prev.filter((s) => s.id !== sceneId);
            syncNovelStats(updated);
            return updated;
          });
          if (activeSceneId === sceneId) {
            setActiveSceneId(scenes.find((s) => s.id !== sceneId)?.id ?? null);
          }
        } catch {
          showError('Failed to delete scene. Please try again.');
        }
      },
    });
  };

  const handleRenameScene = (sceneId: string, title: string) => {
    setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, title } : s)));
    persistScene(sceneId, { title });
  };

  const handleReorderScenes = async (reordered: Scene[]) => {
    setScenes(reordered);
    syncNovelStats(reordered);
    try {
      await Promise.all(
        reordered.map((s) => window.api.saveScene(activeNovelId!, s))
      );
    } catch {
      showError('Failed to save new scene order. Please try reordering again.');
    }
  };

  const handleEditorChange = (html: string, wordCount: number) => {
    if (!activeSceneId) return;
    setScenes((prev) => {
      const updated = prev.map((s) => (s.id === activeSceneId ? { ...s, content: html, wordCount } : s));
      syncNovelStats(updated);
      return updated;
    });
    persistScene(activeSceneId, { content: html, wordCount });
  };

  const handleElementsChange = (elements: Scene['elements']) => {
    if (!activeSceneId) return;
    setScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, elements } : s)));
    persistScene(activeSceneId, { elements });
  };

  const handleStoryGridChange = (storyGrid: Scene['storyGrid']) => {
    if (!activeSceneId) return;
    setScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, storyGrid } : s)));
    persistScene(activeSceneId, { storyGrid });
  };

  const handleReviewStateChange = (reviewState: Record<string, boolean>) => {
    if (!activeSceneId) return;
    setScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, reviewState } : s)));
    persistScene(activeSceneId, { reviewState });
  };

  const handleTodosChange = (todos: TodoItem[]) => {
    if (!activeSceneId) return;
    setScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, todos } : s)));
    persistScene(activeSceneId, { todos });
  };

  const handleAddMustEdit = (markerId: string, note: string, selectedText: string) => {
    if (!activeScene) return;
    const newTodo: TodoItem = {
      id: crypto.randomUUID(),
      label: note || `Edit: "${selectedText}"`,
      done: false,
      mustEditMarkerId: markerId,
    };
    const todos = [...(activeScene.todos ?? []), newTodo];
    handleTodosChange(todos);
  };

  const handleResolveMustEdit = (markerId: string) => {
    if (!activeScene) return;
    const todos = (activeScene.todos ?? []).map((t) =>
      t.mustEditMarkerId === markerId ? { ...t, done: true } : t
    );
    handleTodosChange(todos);
  };

  const syncNovelStats = async (currentScenes: Scene[]) => {
    if (!activeNovel) return;
    const totalWordCount = currentScenes.reduce((sum, s) => sum + s.wordCount, 0);
    const sceneCount = currentScenes.length;
    // Only write if values actually changed to avoid unnecessary disk writes
    if (activeNovel.totalWordCount === totalWordCount && activeNovel.sceneCount === sceneCount) return;
    const updated = { ...activeNovel, totalWordCount, sceneCount };
    setNovels((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    try {
      await window.api.saveNovel(updated);
    } catch {
      showError('Failed to save updated word count.');
    }
  };

  const persistScene = async (sceneId: string, updates: Partial<Scene>) => {
    if (!activeNovelId) return;
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    const updated = { ...scene, ...updates, updatedAt: new Date().toISOString() };
    try {
      await window.api.saveScene(activeNovelId, updated);
    } catch {
      showError('Failed to save changes. Please check your disk space and try again.');
    }
  };

  // ----- Tag operations -----
  const handleCreateTag = (name: string, type: Tag['type']): Tag => {
    const tag: Tag = { id: crypto.randomUUID(), name, type, attributes: {} };
    const updated = [...tags, tag];
    setTags(updated);
    if (activeNovelId) {
      window.api.saveTags(activeNovelId, updated).catch(() => {
        showError('Failed to save new tag.');
      });
    }
    return tag;
  };

  const handleUpdateTag = (tag: Tag) => {
    const updated = tags.map((t) => (t.id === tag.id ? tag : t));
    setTags(updated);
    if (activeNovelId) {
      window.api.saveTags(activeNovelId, updated).catch(() => {
        showError('Failed to save tag changes.');
      });
    }
  };

  const handleDeleteTag = (tagId: string) => {
    const updated = tags.filter((t) => t.id !== tagId);
    setTags(updated);
    if (activeNovelId) {
      window.api.saveTags(activeNovelId, updated).catch(() => {
        showError('Failed to save tag deletion.');
      });
    }
  };

  // ----- Render -----
  if (!activeNovel) {
    return (
      <>
        <NovelLibrary
          novels={novels}
          onOpen={setActiveNovelId}
          onCreate={handleCreateNovel}
          onDelete={handleDeleteNovel}
        />
        {confirmState && (
          <ConfirmDialog
            title={confirmState.title}
            message={confirmState.message}
            confirmLabel={confirmState.confirmLabel}
            onConfirm={confirmState.onConfirm}
            onCancel={() => setConfirmState(null)}
          />
        )}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const totalWordCount = scenes.reduce((sum, s) => sum + s.wordCount, 0);

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="back-btn" onClick={() => setActiveNovelId(null)}>&larr; Library</button>
        <div className="novel-title-block">
          {editingNovelInfo
            ? <h1 style={{ color: '#aac4ff' }}>{activeNovel.title || 'Untitled'}</h1>
            : <h1>{activeNovel.title}</h1>
          }
          <button className="edit-meta-btn" onClick={() => setEditingNovelInfo((s) => !s)}>
            {editingNovelInfo ? 'Done' : 'Edit title / genres / theme'}
          </button>
        </div>
        <div className="header-actions">
          <span className="total-words">{totalWordCount} total words</span>
          <button onClick={() => setShowDictionary(true)}>Dictionary</button>
          <button onClick={() => setShowTagPanel(true)}>Tags &amp; References</button>
          <button onClick={() => setShowStoryMap(true)}>Story Map</button>
          <button onClick={() => setShowReview(true)} disabled={!activeScene}>Review Checklist</button>
          <button className="help-btn" onClick={() => setShowHelp(true)} title="How to use NovelWriter">?</button>
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
          onReorder={handleReorderScenes}
        />

        {activeScene ? (
          <>
            <div className="editor-area">
              <SceneEditor
                scene={activeScene}
                tags={tags}
                onChange={handleEditorChange}
                onCreateTag={handleCreateTag}
                onAddMustEdit={handleAddMustEdit}
                onResolveMustEdit={handleResolveMustEdit}
                onPlanAnchorsChange={setPlanAnchorKeys}
                mustEditJumpId={mustEditJumpId}
                onJumpHandled={() => setMustEditJumpId(null)}
                planJumpKey={planJumpKey}
                onPlanJumpHandled={() => setPlanJumpKey(null)}
              />
            </div>
            <SceneSidebar
              novel={activeNovel}
              scene={activeScene}
              planAnchorKeys={planAnchorKeys}
              onElementsChange={handleElementsChange}
              onTodosChange={handleTodosChange}
              onStoryGridChange={handleStoryGridChange}
              onJumpToMarker={(id) => setMustEditJumpId(id)}
              onJumpToPlanMark={(key) => setPlanJumpKey(key)}
            />
          </>
        ) : (
          <div className="no-scene">Select or create a scene to begin writing.</div>
        )}
      </div>

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      {showStoryMap && (
        <StoryMapPanel
          scenes={scenes}
          onJumpToScene={(id) => { setActiveSceneId(id); setShowStoryMap(false); }}
          onClose={() => setShowStoryMap(false)}
        />
      )}

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

      {showDictionary && (
        <DictionaryPanel onClose={() => setShowDictionary(false)} />
      )}

      {confirmState && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
