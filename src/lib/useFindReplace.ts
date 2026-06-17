import { useState, useCallback, useMemo } from 'react';
import type { Editor } from '@tiptap/react';

export interface FindMatch {
  from: number;
  to: number;
}

// Plain-text search across the document. Case-insensitive by default.
// This walks the ProseMirror doc's text content and computes match
// positions relative to document positions (not raw string indices),
// since ProseMirror positions count node boundaries.
function findMatches(editor: Editor, query: string, caseSensitive: boolean): FindMatch[] {
  if (!query) return [];
  const matches: FindMatch[] = [];
  const searchFor = caseSensitive ? query : query.toLowerCase();

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = caseSensitive ? node.text : node.text.toLowerCase();
    let index = 0;
    while (true) {
      const found = text.indexOf(searchFor, index);
      if (found === -1) break;
      matches.push({ from: pos + found, to: pos + found + query.length });
      index = found + 1; // allow overlapping-adjacent matches like "aa" in "aaa"
    }
  });

  return matches;
}

export function useFindReplace(editor: Editor | null) {
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => {
    if (!editor) return [];
    return findMatches(editor, query, caseSensitive);
  }, [editor, query, caseSensitive, editor?.state.doc]);

  const goToMatch = useCallback((index: number) => {
    if (!editor || matches.length === 0) return;
    const wrapped = ((index % matches.length) + matches.length) % matches.length;
    const match = matches[wrapped];
    editor.commands.setTextSelection({ from: match.from, to: match.to });
    // Scroll the match into view
    editor.commands.scrollIntoView();
    setActiveIndex(wrapped);
  }, [editor, matches]);

  const findNext = useCallback(() => {
    if (matches.length === 0) return;
    goToMatch(activeIndex + 1);
  }, [activeIndex, matches.length, goToMatch]);

  const findPrev = useCallback(() => {
    if (matches.length === 0) return;
    goToMatch(activeIndex - 1);
  }, [activeIndex, matches.length, goToMatch]);

  const replaceCurrent = useCallback(() => {
    if (!editor || matches.length === 0) return;
    const wrapped = ((activeIndex % matches.length) + matches.length) % matches.length;
    const match = matches[wrapped];
    editor
      .chain()
      .focus()
      .insertContentAt({ from: match.from, to: match.to }, replaceText)
      .run();
    // After replacing, matches will recompute; stay at the same index
    // (clamped automatically since `matches` is memoized off doc state)
  }, [editor, matches, activeIndex, replaceText]);

  const replaceAll = useCallback(() => {
    if (!editor || matches.length === 0) return;
    // Replace from the end backwards so earlier positions stay valid
    const chain = editor.chain().focus();
    const sorted = [...matches].sort((a, b) => b.from - a.from);
    sorted.forEach((m) => {
      chain.insertContentAt({ from: m.from, to: m.to }, replaceText);
    });
    chain.run();
    setActiveIndex(0);
  }, [editor, matches, replaceText]);

  return {
    query,
    setQuery,
    replaceText,
    setReplaceText,
    caseSensitive,
    setCaseSensitive,
    matches,
    activeIndex,
    findNext,
    findPrev,
    goToMatch,
    replaceCurrent,
    replaceAll,
  };
}
