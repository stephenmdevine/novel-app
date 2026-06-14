import { v4 as uuid } from 'uuid';
import type { Novel, Scene, ChecklistItem } from '../types';

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: uuid(), label: 'Does the scene open with a clear point-of-view and grounding (where/when/who)?' },
  { id: uuid(), label: 'Does the POV character want something concrete in this scene?' },
  { id: uuid(), label: 'Is there a visible obstacle or source of conflict?' },
  { id: uuid(), label: 'Does the scene change something — situation, relationship, or knowledge?' },
  { id: uuid(), label: 'Is the pacing appropriate (no unnecessary lingering, no rushed beats)?' },
  { id: uuid(), label: 'Is dialogue distinct per character and free of filler?' },
  { id: uuid(), label: 'Are sensory details used to ground the reader without overloading?' },
  { id: uuid(), label: 'Does the scene avoid info-dumping backstory/exposition?' },
  { id: uuid(), label: 'Does the ending create a hook, question, or momentum into the next scene?' },
  { id: uuid(), label: 'Does this scene align with the novel\'s genre and theme?' },
];

export function createEmptyNovel(title: string, genres: string[], theme: string): Novel {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    title,
    genres,
    theme,
    createdAt: now,
    updatedAt: now,
    reviewChecklist: DEFAULT_CHECKLIST,
  };
}

export function createEmptyScene(order: number): Scene {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    title: `Scene ${order + 1}`,
    order,
    content: '',
    wordCount: 0,
    elements: {
      goal: '',
      conflict: '',
      incitingIncident: '',
      complications: '',
      turningPoint: '',
      outcomeHook: '',
    },
    reviewState: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}
