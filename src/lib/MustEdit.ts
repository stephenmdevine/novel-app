import { Mark, mergeAttributes } from '@tiptap/core';

export interface MustEditOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mustEdit: {
      setMustEdit: (markerId: string, note: string) => ReturnType;
      unsetMustEdit: (markerId: string) => ReturnType;
    };
  }
}

export const MustEdit = Mark.create<MustEditOptions>({
  name: 'mustEdit',

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      markerId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-must-edit-id'),
        renderHTML: (attrs) => ({ 'data-must-edit-id': attrs.markerId }),
      },
      note: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-must-edit-note'),
        renderHTML: (attrs) => ({ 'data-must-edit-note': attrs.note }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-must-edit-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'must-edit-mark',
        title: HTMLAttributes['data-must-edit-note'] || 'Must edit',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setMustEdit:
        (markerId: string, note: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { markerId, note });
        },
      unsetMustEdit:
        (markerId: string) =>
        ({ tr, dispatch, state }) => {
          // Remove only the must-edit mark with the matching markerId
          if (!dispatch) return true;
          const { doc } = state;
          doc.descendants((node, pos) => {
            node.marks.forEach((mark) => {
              if (mark.type.name === 'mustEdit' && mark.attrs.markerId === markerId) {
                tr.removeMark(pos, pos + node.nodeSize, mark.type);
              }
            });
          });
          dispatch(tr);
          return true;
        },
    };
  },
});
