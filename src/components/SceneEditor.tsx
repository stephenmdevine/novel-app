import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect, useState } from 'react';
import { EntityTag } from '../lib/EntityTag';
import type { Tag, Scene } from '../types';
import './SceneEditor.css';

interface SceneEditorProps {
  scene: Scene;
  tags: Tag[];
  onChange: (html: string, wordCount: number) => void;
  onCreateTag: (name: string, type: Tag['type']) => Tag;
}

export default function SceneEditor({ scene, tags, onChange, onCreateTag }: SceneEditorProps) {
  const [tagMenuOpen, setTagMenuOpen] = useState(false);

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

  if (!editor) return null;

  const applyTag = (tag: Tag) => {
    editor.chain().focus().setEntityTag(tag.id).run();
    setTagMenuOpen(false);
  };

  const removeTag = () => {
    editor.chain().focus().unsetEntityTag().run();
  };

  const handleNewTag = () => {
    const selection = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to
    );
    if (!selection) {
      alert('Select the text you want to tag first.');
      return;
    }
    const type = prompt('Tag type (character / location / item / other):', 'character') as
      | Tag['type']
      | null;
    if (!type) return;
    const tag = onCreateTag(selection, type);
    applyTag(tag);
  };

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();

  return (
    <div className="scene-editor">
      <div className="editor-toolbar">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}>B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}>I</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}>H2</button>
        <div className="toolbar-divider" />
        <div className="tag-control">
          <button onClick={() => setTagMenuOpen((o) => !o)}>Tag Selection</button>
          {tagMenuOpen && (
            <div className="tag-menu">
              {tags.length === 0 && <div className="tag-menu-empty">No tags yet</div>}
              {tags.map((t) => (
                <div key={t.id} className="tag-menu-item" onClick={() => applyTag(t)}>
                  <span className={`tag-dot tag-${t.type}`} /> {t.name}
                </div>
              ))}
              <div className="tag-menu-item tag-menu-new" onClick={handleNewTag}>
                + New tag from selection
              </div>
            </div>
          )}
        </div>
        <button onClick={removeTag}>Remove Tag</button>
        <div className="toolbar-spacer" />
        <div className="word-count">
          {words} words &middot; {chars} chars
        </div>
      </div>
      <EditorContent editor={editor} className="editor-content" spellCheck={true} />
    </div>
  );
}
