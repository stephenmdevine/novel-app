import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface FindHighlightStorage {
  matches: { from: number; to: number }[];
  activeIndex: number;
}

export const findHighlightKey = new PluginKey('findHighlight');

// Renders highlight decorations for all find matches, with the active
// match styled distinctly. Driven externally via a transaction meta field
// rather than extension options, so React state can push updates without
// recreating the editor.
export const FindHighlight = Extension.create<{}, FindHighlightStorage>({
  name: 'findHighlight',

  addStorage() {
    return { matches: [], activeIndex: 0 };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: findHighlightKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, old) {
            const meta = tr.getMeta(findHighlightKey);
            if (!meta) {
              return old.map(tr.mapping, tr.doc);
            }
            const { matches, activeIndex } = meta as FindHighlightStorage;
            if (!matches || matches.length === 0) return DecorationSet.empty;
            const decorations = matches.map((m, i) =>
              Decoration.inline(m.from, m.to, {
                class: i === activeIndex ? 'find-match find-match-active' : 'find-match',
              })
            );
            return DecorationSet.create(tr.doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
