import { Mark, mergeAttributes } from '@tiptap/core';

// One distinct color per Scene Plan element key
export const PLAN_ELEMENT_COLORS: Record<string, string> = {
  goal:             '#4caf50', // Inciting Incident   — green
  conflict:         '#ff7043', // Prog. Complications — orange
  incitingIncident: '#ab47bc', // Turning Point       — purple
  complications:    '#ef5350', // Crisis              — red
  turningPoint:     '#ffd54f', // Climax              — amber
  outcomeHook:      '#26c6da', // Resolution          — cyan
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    scenePlan: {
      /** Assign current selection to a scene plan element (removes any prior anchor for that key). */
      setScenePlanMark: (elementKey: string) => ReturnType;
      /** Remove the scene plan mark at/around the current cursor position. */
      unsetScenePlanMarkAtCursor: () => ReturnType;
      /** Remove all marks for a given element key across the entire document. */
      clearScenePlanMarkByKey: (elementKey: string) => ReturnType;
    };
  }
}

export const ScenePlanMark = Mark.create({
  name: 'scenePlan',

  addAttributes() {
    return {
      elementKey: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-plan-key]',
        getAttrs: (el) => ({
          elementKey: (el as HTMLElement).getAttribute('data-plan-key'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const key = HTMLAttributes.elementKey as string;
    const color = PLAN_ELEMENT_COLORS[key] ?? '#888';
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-plan-key': key,
        class: 'scene-plan-mark',
        style: `--plan-color: ${color}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setScenePlanMark: (elementKey: string) => ({ tr, dispatch, state }) => {
        const markType = state.schema.marks.scenePlan;
        const { from, to } = state.selection;

        // First, strip any existing mark of this key from the whole doc
        state.doc.descendants((node, pos) => {
          node.marks.forEach((mark) => {
            if (mark.type === markType && mark.attrs.elementKey === elementKey) {
              tr.removeMark(pos, pos + node.nodeSize, markType);
            }
          });
        });

        // Apply new mark to selection
        tr.addMark(from, to, markType.create({ elementKey }));

        if (dispatch) dispatch(tr);
        return true;
      },

      unsetScenePlanMarkAtCursor: () => ({ tr, dispatch, state }) => {
        const markType = state.schema.marks.scenePlan;
        const { from } = state.selection;
        let found = false;

        state.doc.descendants((node, pos) => {
          node.marks.forEach((mark) => {
            if (
              mark.type === markType &&
              pos <= from &&
              pos + node.nodeSize >= from
            ) {
              tr.removeMark(pos, pos + node.nodeSize, markType);
              found = true;
            }
          });
        });

        if (dispatch && found) dispatch(tr);
        return found;
      },

      clearScenePlanMarkByKey: (elementKey: string) => ({ tr, dispatch, state }) => {
        const markType = state.schema.marks.scenePlan;
        let found = false;

        state.doc.descendants((node, pos) => {
          node.marks.forEach((mark) => {
            if (mark.type === markType && mark.attrs.elementKey === elementKey) {
              tr.removeMark(pos, pos + node.nodeSize, markType);
              found = true;
            }
          });
        });

        if (dispatch && found) dispatch(tr);
        return found;
      },
    };
  },
});

/** Scan a ProseMirror doc and return the set of element keys that have anchors. */
export function getAnchoredPlanKeys(doc: any): Set<string> {
  const keys = new Set<string>();
  doc.descendants((node: any) => {
    node.marks.forEach((mark: any) => {
      if (mark.type.name === 'scenePlan' && mark.attrs.elementKey) {
        keys.add(mark.attrs.elementKey as string);
      }
    });
  });
  return keys;
}
