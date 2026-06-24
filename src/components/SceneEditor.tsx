import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect, useRef, useState } from 'react';
import { EntityTag } from '../lib/EntityTag';
import { MustEdit } from '../lib/MustEdit';
import { FindHighlight, findHighlightKey } from '../lib/FindHighlight';
import { ScenePlanMark, PLAN_ELEMENT_COLORS, getAnchoredPlanKeys } from '../lib/ScenePlanMark';
import { useFindReplace } from '../lib/useFindReplace';
import FindReplaceBar from './FindReplaceBar';
import type { Tag, Scene } from '../types';
import { DEFAULT_SCENE_ELEMENT_LABELS } from '../types';
import type { SceneElements } from '../types';
import './SceneEditor.css';

interface SceneEditorProps {
  scene: Scene;
  tags: Tag[];
  onChange: (html: string, wordCount: number) => void;
  onCreateTag: (name: string, type: Tag['type']) => Tag;
  onAddMustEdit: (markerId: string, note: string, selectedText: string) => void;
  onResolveMustEdit: (markerId: string) => void;
  onPlanAnchorsChange: (keys: Set<string>) => void;
  mustEditJumpId: string | null;
  onJumpHandled: () => void;
  planJumpKey: string | null;
  onPlanJumpHandled: () => void;
}

type TagMenuState = 'closed' | 'list' | 'new';
type MustEditMenuState = 'closed' | 'form';

export default function SceneEditor({
  scene,
  tags,
  onChange,
  onCreateTag,
  onAddMustEdit,
  onResolveMustEdit,
  onPlanAnchorsChange,
  mustEditJumpId,
  onJumpHandled,
  planJumpKey,
  onPlanJumpHandled,
}: SceneEditorProps) {
  const [tagMenu, setTagMenu] = useState<TagMenuState>('closed');
  const [mustEditMenu, setMustEditMenu] = useState<MustEditMenuState>('closed');
  const [planMenuOpen, setPlanMenuOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagType, setNewTagType] = useState<Tag['type']>('character');
  const [mustEditNote, setMustEditNote] = useState('');
  const savedSelection = useRef<{ from: number; to: number } | null>(null);
  const newTagNameRef = useRef<HTMLInputElement>(null);
  const mustEditNoteRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [findOpen, setFindOpen] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
      EntityTag,
      MustEdit,
      FindHighlight,
      ScenePlanMark,
    ],
    content: scene.content || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const words = editor.storage.characterCount.words();
      onChange(html, words);
      // Report which plan element keys currently have anchors
      onPlanAnchorsChange(getAnchoredPlanKeys(editor.state.doc));
    },
  });

  const fr = useFindReplace(editor);

  // Push match decorations into the editor whenever matches or active index change
  useEffect(() => {
    if (!editor) return;
    const tr = editor.state.tr.setMeta(findHighlightKey, {
      matches: findOpen ? fr.matches : [],
      activeIndex: fr.activeIndex,
    });
    editor.view.dispatch(tr);
  }, [editor, fr.matches, fr.activeIndex, findOpen]);

  // Ctrl/Cmd+F opens find bar; Escape closes it
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFindOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Reload content when switching scenes
  useEffect(() => {
    if (editor && editor.getHTML() !== scene.content) {
      editor.commands.setContent(scene.content || '<p></p>');
      // Report anchors for newly loaded scene
      onPlanAnchorsChange(getAnchoredPlanKeys(editor.state.doc));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);

  // Focus inputs when menus open
  useEffect(() => {
    if (tagMenu === 'new') setTimeout(() => newTagNameRef.current?.focus(), 50);
  }, [tagMenu]);

  useEffect(() => {
    if (mustEditMenu === 'form') setTimeout(() => mustEditNoteRef.current?.focus(), 50);
  }, [mustEditMenu]);

  // Jump to a must-edit marker when clicked from todo list
  useEffect(() => {
    if (!mustEditJumpId || !editor) return;
    const { doc } = editor.state;
    let found = false;
    doc.descendants((node, pos) => {
      if (found) return false;
      node.marks.forEach((mark) => {
        if (mark.type.name === 'mustEdit' && mark.attrs.markerId === mustEditJumpId) {
          editor.commands.setTextSelection({ from: pos, to: pos + node.nodeSize });
          editor.commands.focus();
          found = true;
        }
      });
    });
    onJumpHandled();
  }, [mustEditJumpId]);

  // Jump to a scene plan anchor when clicked from sidebar
  useEffect(() => {
    if (!planJumpKey || !editor) return;
    const { doc } = editor.state;
    let found = false;
    doc.descendants((node, pos) => {
      if (found) return false;
      node.marks.forEach((mark) => {
        if (mark.type.name === 'scenePlan' && mark.attrs.elementKey === planJumpKey) {
          editor.commands.setTextSelection({ from: pos, to: pos + node.nodeSize });
          editor.commands.focus();
          found = true;
        }
      });
    });
    if (!found) showToast('No text anchored to that plan element yet.');
    onPlanJumpHandled();
  }, [planJumpKey]);

  if (!editor) return null;

  // ---- Tag handlers ----

  const handleTagButtonMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setMustEditMenu('closed');
    setPlanMenuOpen(false);
    if (tagMenu !== 'closed') { setTagMenu('closed'); return; }
    const { from, to } = editor.state.selection;
    if (from === to) { showToast('Select some text first, then click "Tag Selection".'); editor.commands.focus(); return; }
    savedSelection.current = { from, to };
    setNewTagName(editor.state.doc.textBetween(from, to));
    setTagMenu('list');
  };

  const applyTag = (tag: Tag) => {
    if (!savedSelection.current) return;
    const { from, to } = savedSelection.current;
    editor.chain().focus().setTextSelection({ from, to }).setEntityTag(tag.id).run();
    savedSelection.current = null;
    setTagMenu('closed');
  };

  const handleCreateAndApply = () => {
    if (!newTagName.trim()) return;
    const tag = onCreateTag(newTagName.trim(), newTagType);
    applyTag(tag);
    setNewTagName('');
    setNewTagType('character');
  };

  // ---- Must-Edit handlers ----

  const handleMustEditMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setTagMenu('closed');
    setPlanMenuOpen(false);
    if (mustEditMenu !== 'closed') { setMustEditMenu('closed'); return; }
    const { from, to } = editor.state.selection;
    if (from === to) { showToast('Select the text you want to mark first.'); editor.commands.focus(); return; }
    savedSelection.current = { from, to };
    setMustEditNote('');
    setMustEditMenu('form');
  };

  const handleCreateMustEdit = () => {
    if (!savedSelection.current) return;
    const { from, to } = savedSelection.current;
    const selectedText = editor.state.doc.textBetween(from, to);
    const markerId = crypto.randomUUID();
    const note = mustEditNote.trim() || `Edit: "${selectedText}"`;
    editor.chain().focus().setTextSelection({ from, to }).setMustEdit(markerId, note).run();
    onAddMustEdit(markerId, note, selectedText);
    savedSelection.current = null;
    setMustEditMenu('closed');
    setMustEditNote('');
  };

  const handleResolveMustEdit = () => {
    const { from } = editor.state.selection;
    const resolvedMarks: string[] = [];
    editor.state.doc.descendants((node, pos) => {
      node.marks.forEach((mark) => {
        if (
          mark.type.name === 'mustEdit' &&
          pos <= from &&
          pos + node.nodeSize >= from
        ) {
          resolvedMarks.push(mark.attrs.markerId);
        }
      });
    });
    if (resolvedMarks.length === 0) {
      showToast('Place your cursor inside a highlighted must-edit passage first.');
      editor.commands.focus();
      return;
    }
    resolvedMarks.forEach((id) => {
      (editor.commands as any).unsetMustEdit(id);
      onResolveMustEdit(id);
    });
  };

  // ---- Scene Plan anchor handlers ----

  const handlePlanMenuMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setTagMenu('closed');
    setMustEditMenu('closed');
    if (planMenuOpen) { setPlanMenuOpen(false); return; }
    const { from, to } = editor.state.selection;
    if (from === to) {
      showToast('Select the passage you want to anchor first.');
      editor.commands.focus();
      return;
    }
    savedSelection.current = { from, to };
    setPlanMenuOpen(true);
  };

  const applyPlanMark = (elementKey: string) => {
    if (!savedSelection.current) return;
    const { from, to } = savedSelection.current;
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .setScenePlanMark(elementKey)
      .run();
    onPlanAnchorsChange(getAnchoredPlanKeys(editor.state.doc));
    savedSelection.current = null;
    setPlanMenuOpen(false);
  };

  const handleRemovePlanMarkMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const removed = (editor.commands as any).unsetScenePlanMarkAtCursor();
    if (!removed) {
      showToast('Place your cursor inside a plan-anchored passage first.');
    }
    onPlanAnchorsChange(getAnchoredPlanKeys(editor.state.doc));
    editor.commands.focus();
  };

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();

  return (
    <div className="scene-editor">
      <div className="editor-toolbar">
        {/* Formatting */}
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          className={editor.isActive('bold') ? 'active' : ''}
        >B</button>
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          className={editor.isActive('italic') ? 'active' : ''}
        >I</button>
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
        >H2</button>

        <div className="toolbar-divider" />

        {/* Tag selection */}
        <div className="tag-control">
          <button
            onMouseDown={handleTagButtonMouseDown}
            className={tagMenu !== 'closed' ? 'active' : ''}
            title="Select text in the editor, then click to tag it as a character, location, item, or other entity"
          >Tag Selection</button>

          {tagMenu === 'list' && (
            <div className="tag-menu">
              {tags.length === 0
                ? <div className="tag-menu-empty">No tags yet</div>
                : tags.map((t) => (
                  <div key={t.id} className="tag-menu-item"
                    onMouseDown={(e) => { e.preventDefault(); applyTag(t); }}>
                    <span className={`tag-dot tag-${t.type}`} /> {t.name}
                  </div>
                ))
              }
              <div className="tag-menu-item tag-menu-new"
                onMouseDown={(e) => { e.preventDefault(); setTagMenu('new'); }}>
                + New tag from selection
              </div>
            </div>
          )}

          {tagMenu === 'new' && (
            <div className="tag-menu tag-menu-form">
              <div className="tag-form-title">New Tag</div>
              <label className="tag-form-label">Name</label>
              <input ref={newTagNameRef} className="tag-form-input" value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndApply(); }}
                placeholder="Tag name" />
              <label className="tag-form-label">Type</label>
              <select className="tag-form-input" value={newTagType}
                onChange={(e) => setNewTagType(e.target.value as Tag['type'])}>
                <option value="character">Character</option>
                <option value="location">Location</option>
                <option value="item">Item</option>
                <option value="other">Other</option>
              </select>
              <div className="tag-form-actions">
                <button className="tag-form-cancel"
                  onMouseDown={(e) => { e.preventDefault(); setTagMenu('list'); }}>Back</button>
                <button className="tag-form-submit"
                  onMouseDown={(e) => { e.preventDefault(); handleCreateAndApply(); }}>
                  Create &amp; Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetEntityTag().run(); }}
          title="Place your cursor inside tagged text, then click to remove the tag"
        >
          Remove Tag
        </button>

        <div className="toolbar-divider" />

        {/* Must-Edit */}
        <div className="tag-control">
          <button
            onMouseDown={handleMustEditMouseDown}
            className={`must-edit-btn ${mustEditMenu !== 'closed' ? 'active' : ''}`}
            title="Select the text that needs revision, then click to mark it and create a linked to-do"
          >✎ Must Edit</button>

          {mustEditMenu === 'form' && (
            <div className="tag-menu tag-menu-form">
              <div className="tag-form-title">Mark as Must Edit</div>
              <label className="tag-form-label">Reminder note (optional)</label>
              <input
                ref={mustEditNoteRef}
                className="tag-form-input"
                value={mustEditNote}
                onChange={(e) => setMustEditNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateMustEdit(); }}
                placeholder="e.g. Need a name for the innkeeper"
              />
              <div className="tag-form-actions">
                <button className="tag-form-cancel"
                  onMouseDown={(e) => { e.preventDefault(); setMustEditMenu('closed'); }}>Cancel</button>
                <button className="tag-form-submit"
                  onMouseDown={(e) => { e.preventDefault(); handleCreateMustEdit(); }}>
                  Mark &amp; Add To-Do
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onMouseDown={(e) => { e.preventDefault(); handleResolveMustEdit(); }}
          className="resolve-btn"
          title="Place cursor inside highlighted text, then click to resolve"
        >
          ✓ Resolve
        </button>

        <div className="toolbar-divider" />

        {/* Scene Plan anchor */}
        <div className="tag-control">
          <button
            onMouseDown={handlePlanMenuMouseDown}
            className={`plan-anchor-btn ${planMenuOpen ? 'active' : ''}`}
            title="Select text, then anchor it to a Scene Plan element"
          >
            ¶ Anchor to Plan
          </button>

          {planMenuOpen && (
            <div className="tag-menu plan-anchor-menu">
              <div className="tag-menu-empty" style={{ paddingBottom: 4 }}>
                Anchor selection as…
              </div>
              {(Object.keys(DEFAULT_SCENE_ELEMENT_LABELS) as Array<keyof SceneElements>).map((key) => (
                <div
                  key={key}
                  className="tag-menu-item"
                  onMouseDown={(e) => { e.preventDefault(); applyPlanMark(key); }}
                >
                  <span
                    className="plan-anchor-dot"
                    style={{ background: PLAN_ELEMENT_COLORS[key] }}
                  />
                  {DEFAULT_SCENE_ELEMENT_LABELS[key]}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onMouseDown={handleRemovePlanMarkMouseDown}
          className="plan-remove-btn"
          title="Place cursor inside an anchored passage to remove its plan anchor"
        >
          Remove Anchor
        </button>

        <div className="toolbar-divider" />

        <button
          onMouseDown={(e) => { e.preventDefault(); setFindOpen((o) => !o); }}
          className={findOpen ? 'active' : ''}
          title="Find & Replace (Ctrl+F)"
        >
          🔍 Find
        </button>

        <div className="toolbar-spacer" />
        <div className="word-count">{words} words &middot; {chars} chars</div>
      </div>

      {findOpen && (
        <FindReplaceBar fr={fr} onClose={() => setFindOpen(false)} />
      )}

      <EditorContent editor={editor} className="editor-content" spellCheck={true} />
      {toast && <div className="editor-toast">{toast}</div>}
    </div>
  );
}
