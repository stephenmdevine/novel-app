// ---------- Core data model ----------

export interface ChecklistItem {
  id: string;
  label: string;
}

export interface Novel {
  id: string;
  title: string;
  genres: string[]; // one or two genres
  theme: string;
  createdAt: string;
  updatedAt: string;
  // Editable list of checklist items used for the post-draft review
  reviewChecklist: ChecklistItem[];
}

// The 6 fundamental scene-planning elements.
// Stored as a flexible map so the user can relabel/extend if desired,
// but we ship sensible defaults.
export interface SceneElements {
  goal: string; // what the POV character wants in this scene
  conflict: string; // what's working against that goal
  incitingIncident: string; // what kicks the scene into motion
  complications: string; // obstacles/turns that escalate things
  turningPoint: string; // the moment that changes the trajectory
  outcomeHook: string; // resolution + hook into the next scene
}

export const DEFAULT_SCENE_ELEMENT_LABELS: Record<keyof SceneElements, string> = {
  goal: 'Inciting Incident',
  conflict: 'Progressive Complications',
  incitingIncident: 'Turning Point',
  complications: 'Crisis',
  turningPoint: 'Climax',
  outcomeHook: 'Resolution',
};

export interface TodoItem {
  id: string;
  label: string;
  done: boolean;
  mustEditMarkerId?: string; // if set, linked to a must-edit marker in the editor
}

export interface MustEditMarker {
  id: string;
  note: string; // brief reminder note
}

export interface Scene {
  id: string;
  title: string;
  order: number;
  content: string; // Tiptap JSON serialized as string, or HTML
  wordCount: number;
  elements: SceneElements;
  reviewState: Record<string, boolean>; // checklist item id -> completed
  todos: TodoItem[];
  createdAt: string;
  updatedAt: string;
}

// ---------- Tags ----------

export type TagType = 'character' | 'location' | 'item' | 'other';

export interface Tag {
  id: string;
  name: string;
  type: TagType;
  attributes: Record<string, string>; // free-form key/value, e.g. { age: '34', role: 'protagonist' }
  attributeScenes?: Record<string, string>; // attribute key -> sceneId where the fact was established
  color?: string;
}

// ---------- Electron API surface (window.api) ----------

export interface ElectronAPI {
  listNovels: () => Promise<Novel[]>;
  createNovel: (novel: Novel) => Promise<Novel>;
  saveNovel: (novel: Novel) => Promise<Novel>;
  deleteNovel: (novelId: string) => Promise<boolean>;

  listScenes: (novelId: string) => Promise<Scene[]>;
  saveScene: (novelId: string, scene: Scene) => Promise<Scene>;
  deleteScene: (novelId: string, sceneId: string) => Promise<boolean>;

  listTags: (novelId: string) => Promise<Tag[]>;
  saveTags: (novelId: string, tags: Tag[]) => Promise<Tag[]>;

  listDictionaryWords: () => Promise<string[]>;
  addDictionaryWord: (word: string) => Promise<boolean>;
  removeDictionaryWord: (word: string) => Promise<boolean>;

  getNovelsRoot: () => Promise<string>;
  revealInFolder: (novelId: string) => Promise<void>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
