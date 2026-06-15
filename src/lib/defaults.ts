import { v4 as uuid } from 'uuid';
import type { Novel, Scene, ChecklistItem } from '../types';

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: uuid(), label: 'Conscious Object of Desire: Can you identify a clear, concrete, S.M.A.R.T. Object of Desire for the protagonist? For each character, word the OoD as: [CHARACTER] wants [X] without having to [Y].' },
  { id: uuid(), label: 'Five Commandments: Can you identify each of the 5 Commandments of Storytelling? Is there a clear Value Shift by the end of the scene?' },
  { id: uuid(), label: 'Progressive Complications: Does the protagonist continue changing tactics as their OoD is denied by the force(s) of antagonism?' },
  { id: uuid(), label: 'Correct Balance: Is the protagonist too competent? Do they actually reach a Turning Point and Crisis? Are the forces of antagonism appropriately strong / matched with the protagonist?' },
  { id: uuid(), label: 'Showing Writing: Is the writer relying on Telling language to write the story instead of Showing?' },
  { id: uuid(), label: 'Consistent Genre: Does the Value at Stake change between the Inciting Incident and Resolution or do you have a consistent genre?' },
  { id: uuid(), label: 'Protagonist as Outputter: Did the writer put the protagonist in the Inputter role instead of the Outputter role (they should React to the Inciting Incident, not causing it)?' },
  { id: uuid(), label: 'Infodumping: Does the writer deliver too much information to the reader at once and/or before the reader needs to know it?' },
  { id: uuid(), label: 'Scene Starts Too Early: Does the Inciting Incident come too late in the scene?' },
  { id: uuid(), label: 'Bad Dialogue: Is the dialogue speaking to the reader instead of the other characters?' },
  { id: uuid(), label: 'Inconsistent Action: Do things happen in a linear way or is it hopping back and forth in time causing confusion for the reader?' },
  { id: uuid(), label: 'Valenced Language: Are adjectives and adverbs incorrectly making up for bad nouns and verbs?' },
  { id: uuid(), label: 'Well-Developed Setting & Characters: Are the correct details for the setting and characters given to the point where the reader can follow the story without over-developing them and leading to infodumping?' },
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
