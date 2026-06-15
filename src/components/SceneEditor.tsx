import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect, useRef, useState } from 'react';
import { EntityTag } from '../lib/EntityTag';
import type { Tag, Scene } from '../types';
import './SceneEditor.css';

interface SceneEditorProps {
  scene: Scene;
  tags: Tag[];
  onChange: (html: string, wordCount: number) => void;
  onCreateTag: (name: string, type: Tag['type']) => Tag;
}

type TagMenuState = 'closed' | 'list' | 'new';

export default function SceneEditor({ scene, tags, onChange, onCreateTag }: SceneEditorProps) {
  const [tagMenu, setTagMenu] = useState<TagMenuState>('closed');
  const [newTagName, setNewTagName] = useState('');
  const [newTagType, setNewTagType] = useState<Tag['type']>('character');
  const savedSelection = useRef<{ from: number; to: number } | null>(null);
  const newTagNameRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
      EntityTag,
    ],
    content: scene.content || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const words = editor.storage.characterCount.words();
      onChange(html, words);
    },
  });

  // Reload content when switching scenes
  useEffect(() => {
    if (editor && editor.getHTML() !== scene.content) {
      editor.commands.setContent(scene.content || '<p></p>');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);

  // Focus the name input when switching to new-tag form
  useEffect(() => {
    if (tagMenu === 'new') {
      setTimeout(() => newTagNameRef.current?.focus(), 50);
    }
  }, [tagMenu]);

  if (!editor) return null;

  const handleTagButtonMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (tagMenu !== 'closed') {
      setTagMenu('closed');
      return;
    }
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Select some text in the editor first, then click "Tag Selection".');
      return;
    }
    savedSelection.current = { from, to };
    const selectedText = editor.state.doc.textBetween(from, to);
    setNewTagName(selectedText);
    setTagMenu('list');
  };

  const applyTag = (tag: Tag) => {
    if (!savedSelection.current) return;
    const { from, to } = savedSelection.current;
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .setEntityTag(tag.id)
      .run();
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

  const removeTag = () => {
    editor.chain().focus().unsetEntityTag().run();
  };

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();

  return (
    <div className="scene-editor">
      <div className="editor-toolbar">
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
        <div className="tag-control">
          <button
            onMouseDown={handleTagButtonMouseDown}
            className={tagMenu !== 'closed' ? 'active' : ''}
          >
            Tag Selection
          </button>

          {tagMenu === 'list' && (
            <div className="tag-menu">
              {tags.length === 0 ? (
                <div className="tag-menu-empty">No tags yet</div>
              ) : (
                tags.map((t) => (
                  <div
                    key={t.id}
                    className="tag-menu-item"
                    onMouseDown={(e) => { e.preventDefault(); applyTag(t); }}
                  >
                    <span className={`tag-dot tag-${t.type}`} /> {t.name}
                  </div>
                ))
              )}
              <div
                className="tag-menu-item tag-menu-new"
                onMouseDown={(e) => { e.preventDefault(); setTagMenu('new'); }}
              >
                + New tag from selection
              </div>
            </div>
          )}

          {tagMenu === 'new' && (
            <div className="tag-menu tag-menu-form">
              <div className="tag-form-title">New Tag</div>
              <label className="tag-form-label">Name</label>
              <input
                ref={newTagNameRef}
                className="tag-form-input"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndApply(); }}
                placeholder="Tag name"
              />
              <label className="tag-form-label">Type</label>
              <select
                className="tag-form-input"
                value={newTagType}
                onChange={(e) => setNewTagType(e.target.value as Tag['type'])}
              >
                <option value="character">Character</option>
                <option value="location">Location</option>
                <option value="item">Item</option>
                <option value="other">Other</option>
              </select>
              <div className="tag-form-actions">
                <button
                  className="tag-form-cancel"
                  onMouseDown={(e) => { e.preventDefault(); setTagMenu('list'); }}
                >
                  Back
                </button>
                <button
                  className="tag-form-submit"
                  onMouseDown={(e) => { e.preventDefault(); handleCreateAndApply(); }}
                >
                  Create &amp; Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <button onMouseDown={(e) => { e.preventDefault(); removeTag(); }}>Remove Tag</button>
        <div className="toolbar-spacer" />
        <div className="word-count">
          {words} words &middot; {chars} chars
        </div>
      </div>
      <EditorContent editor={editor} className="editor-content" spellCheck={true} />
    </div>
  );
}
