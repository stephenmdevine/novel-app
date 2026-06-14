import { Mark, mergeAttributes } from '@tiptap/core';

// A Tiptap mark that wraps text and links it to a Tag by ID.
// The displayed text is the raw text content; the tag's *current* name
// lives in the tag registry (tags.json), so renaming a tag's name
// attribute does not require rewriting scene content — only the
// highlight/tooltip reflects the live name.
export interface EntityTagOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    entityTag: {
      setEntityTag: (tagId: string) => ReturnType;
      unsetEntityTag: () => ReturnType;
    };
  }
}

export const EntityTag = Mark.create<EntityTagOptions>({
  name: 'entityTag',

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      tagId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-tag-id'),
        renderHTML: (attributes) => ({ 'data-tag-id': attributes.tagId }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-tag-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'entity-tag' }),
      0,
    ];
  },

  addCommands() {
    return {
      setEntityTag:
        (tagId: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { tagId });
        },
      unsetEntityTag:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
