# NovelWriter

A desktop writing application for novelists built on Electron, React, and TypeScript. NovelWriter keeps your manuscript and your story structure in the same place — write in a rich text editor, plan scenes using a Five Commandments framework, track characters and locations with a tagging system, and visualize your novel's polarity arc across every scene.

---

## Table of Contents

- [Getting Started (Developers)](#getting-started-developers)
- [Features](#features)
- [How to Use](#how-to-use)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Data Storage](#data-storage)
- [Building for Distribution](#building-for-distribution)
- [Architecture Notes](#architecture-notes)

---

## Getting Started (Developers)

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Install and run

```bash
git clone https://github.com/yourusername/novelwriter.git
cd novelwriter
npm install
npm run electron:dev
```

The dev script compiles the Electron main process first, then starts Vite and Electron together. There is no separate Vite server step — `electron:dev` handles everything.

### Build a distributable

```bash
npm run dist
```

This runs the Vite production build, compiles the Electron process, and packages everything into a platform-native installer in the `release/` folder. See [Building for Distribution](#building-for-distribution) for platform-specific details.

---

## Features

### Novel Library
Create and manage multiple novels from a central library screen. Each novel card shows its title, genre(s), theme, total scene count, and total word count. Word counts update in real time as you write.

### Scene Management
Each novel contains an ordered list of scenes in a left sidebar. Scenes can be renamed inline, reordered by dragging the handle on the left of each card, and deleted. Word count is displayed per scene.

### Rich Text Editor
A full-featured prose editor powered by Tiptap (ProseMirror). Supports bold, italic, and heading formatting. Paragraphs are auto-indented. Native Electron spellcheck is enabled with right-click suggestions and a custom dictionary you manage through the app.

### Scene Planning Sidebar
A right sidebar with two tabs — **Scene Plan** and **Story Grid** — that persist alongside each scene.

**Scene Plan** provides six fields mapped to the Five Commandments of Storytelling: Inciting Incident, Progressive Complications, Turning Point, Crisis, Climax, and Resolution. Each field accepts free-form planning notes.

**Story Grid** tracks structured scene data: Scene Value (start and end), Polarity, POV Character, Scene Location, Period/Time, Duration, and Turning Point type (Active or Revelatory).

### Scene Plan Anchors
Select any passage in the editor and use **¶ Anchor to Plan** in the toolbar to link that prose to a specific Scene Plan element. The passage is highlighted in a color unique to that element. The element's label in the sidebar becomes a clickable jump button (↗) that scrolls the editor to the anchored text. Each element holds one anchor; reassigning it removes the previous one automatically.

### Entity Tagging
Select text and tag it as a character, location, item, or other entity. Tagged text is highlighted with a colored underline. The **Tags & References** panel (header button) shows every scene that mentions each tag, lets you rename tags (propagating everywhere automatically), and lets you add free-form attributes (age, role, eye color, etc.) with optional scene attribution — pin each attribute to the scene where that fact was first established for a direct jump link back to the source.

### Must Edit Markers
Select any passage that needs revision and click **✎ Must Edit** to mark it with a yellow highlight and an optional reminder note. A linked to-do item is created automatically in the Scene To-Do list. Click **✓ Resolve** with your cursor inside the highlighted passage to clear the mark and check off the to-do simultaneously.

### Scene To-Do List
A per-scene checklist at the bottom of the right sidebar. Add manual to-dos by typing and pressing Enter. Must Edit markers create linked to-dos automatically — clicking the ✎ label on a linked item scrolls the editor to its passage.

### Find & Replace
Press **Ctrl+F** or click 🔍 Find in the toolbar to open an in-editor search bar. Supports case-sensitive search, next/previous match navigation, replace-one, and replace-all. Press **Escape** to close.

### Review Checklist
A 13-item post-draft checklist (based on the Story Grid framework) that steps through one item at a time per scene. Progress is saved per scene. The dot row at the bottom lets you jump to any item directly. Checklist items are customizable per novel.

### Custom Dictionary
Right-click any spellcheck-underlined word for suggestions or to add it to your custom dictionary. The **Dictionary** panel (header button) lets you view, add, and remove custom words at any time. The dictionary is global across all novels.

### Story Map
Open **Story Map** from the header to see a compiled view of Story Grid data across all scenes.

- **Grid Table** — one row per scene, all Story Grid fields side by side, with a completeness indicator (green = complete, amber = partial, gray = empty). Click any row to jump to that scene.
- **Polarity Arc** — a visual chart showing the novel's emotional rhythm. Each scene is a colored line segment sloping toward positive or negative based on its polarity. Hover to highlight; click to jump.

---

## How to Use

### Starting a novel

1. Launch the app. The library screen shows all your novels.
2. Click **+ New Novel** and enter a title, up to two genres, and a theme.
3. The novel opens automatically. Click **+ New** in the left scene panel to create your first scene.

### Writing a scene

1. Select a scene from the left panel to open it in the editor.
2. Write normally. The editor auto-saves as you type.
3. Use the toolbar for formatting (B, I, H2) or the keyboard shortcuts Ctrl+B and Ctrl+I.
4. Right-click misspelled words for spelling suggestions.

### Planning with the Scene Plan

1. Before or while writing, switch to the **Scene Plan** tab in the right sidebar.
2. Fill in the six fields with planning notes — what the Inciting Incident should be, how the crisis manifests, etc.
3. After drafting, select the passage that *is* the Inciting Incident, click **¶ Anchor to Plan**, and choose Inciting Incident from the menu. The passage is highlighted green and the label in the sidebar becomes a jump button.
4. Repeat for each element you want to anchor.

### Tagging characters and locations

1. Select a character's name (or any reference to a location or item) in the editor.
2. Click **Tag Selection** in the toolbar. Choose an existing tag or create a new one.
3. Open **Tags & References** from the header to add attributes to a tag, see which scenes mention it, and jump between references.

### Marking passages for revision

1. Select the text that needs work.
2. Click **✎ Must Edit** and add a brief reminder note (optional).
3. The passage is highlighted yellow. A linked to-do appears in the Scene To-Do list below the sidebar.
4. When you've addressed the passage, place your cursor inside it and click **✓ Resolve**.

### Filling in Story Grid data

1. After completing a scene draft, switch to the **Story Grid** tab in the right sidebar.
2. Fill in the Scene Value fields (what value is at stake at the start and end of the scene), then set the Polarity, POV Character, Location, Period, Duration, and Turning Point type.
3. Open **Story Map** from the header to see all scenes together. The Polarity Arc will reflect your entries as you fill them in — you don't need every scene complete before it's useful.

### Reviewing a completed scene

1. With the scene open, click **Review Checklist** in the header.
2. Step through each item using Next/Previous or click the dots to jump directly.
3. Check off each item when satisfied. Progress is saved automatically.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+F` | Open Find & Replace |
| `Escape` | Close Find & Replace |
| `Enter` | Submit inline forms (add to-do, add tag attribute, etc.) |

---

## Data Storage

Novels are stored as plain files on your filesystem — there is no database.

```
~/Documents/NovelWriter/novels/
└── <novel-id>/
    ├── novel.json        # Title, genres, theme, checklist, word count summary
    ├── tags.json         # All tags and their attributes for this novel
    └── scenes/
        ├── <scene-id>.json
        ├── <scene-id>.json
        └── ...
```

Each scene file contains its full content (as HTML), word count, Scene Plan elements, Story Grid data, to-do items, and review state. Files are written on every change.

Because everything is plain JSON in a known location, your novels are safe to back up with any tool — Time Machine, Dropbox, a simple zip, or a git repository of your writing. No export step required.

The custom dictionary is managed by Electron's Chromium session and is stored separately from novel data, in your OS's standard application data directory. It persists across all novels.

---

## Building for Distribution

Install `electron-builder` if you haven't already:

```bash
npm install --save-dev electron-builder
```

Add the following `build` configuration to `package.json`:

```json
"build": {
  "appId": "com.yourname.novelwriter",
  "productName": "NovelWriter",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*"
  ],
  "mac": {
    "target": "dmg",
    "icon": "assets/icon.icns"
  },
  "win": {
    "target": "nsis",
    "icon": "assets/icon.ico"
  },
  "linux": {
    "target": "AppImage",
    "icon": "assets/icon.png"
  }
}
```

Then run:

```bash
npm run dist
```

Output is placed in `release/`. Platform notes:

- **macOS** — Produces a `.dmg`. Without an Apple Developer code signing certificate, Gatekeeper will warn on first launch. Recipients can bypass this by right-clicking the app and choosing Open.
- **Windows** — Produces an `.exe` installer via NSIS. Windows Defender SmartScreen will flag unsigned executables; recipients dismiss this by clicking "More info → Run anyway."
- **Linux** — Produces an `.AppImage`. No signing required. Recipients make it executable (`chmod +x`) and run it directly.

Icon files (`assets/icon.icns`, `assets/icon.ico`, `assets/icon.png` at 512×512) are required for a clean build.

---

## Architecture Notes

These are relevant if you're modifying the codebase.

**Module format** — `package.json` uses `"type": "module"`, but Electron's main process requires CommonJS. The build script compiles `electron/main.ts` and `electron/preload.ts` to `.cjs` files via a post-build rename. The `preload` path in `main.ts` must reference `preload.cjs`, not `preload.js` — this has caused regressions before.

**Editor toolbar buttons** — All toolbar buttons in `SceneEditor.tsx` use `onMouseDown` + `e.preventDefault()` instead of `onClick`. This prevents the button click from stealing focus away from the Tiptap editor, which would collapse the cursor.

**Tag identity** — Scene content references tags by ID (`data-tag-id`), not by name. Renaming a tag in the Tags & References panel propagates everywhere because the display name is looked up from the tag object at render time, not stored in the scene HTML.

**Scene Plan anchors** — Anchors are stored as ProseMirror marks (`data-plan-key`) directly in the scene's HTML content. Each element key (`goal`, `conflict`, `incitingIncident`, `complications`, `turningPoint`, `outcomeHook`) can have at most one anchor at a time. Applying a new anchor for a key removes the previous one across the entire document before applying the new one.

**Overlapping marks** — Entity tags use a bottom border (blue). Must Edit markers use a bottom border (yellow) and yellow background. Scene Plan anchors use a top border (element color) and a tinted background. This separation by CSS property means all three can coexist on a single text span without fully clobbering each other visually.

**Dev script** — Use `npm run electron:dev`. This runs `build:electron` first (not concurrently) before starting Vite and Electron together via `concurrently`. Running Vite and the Electron build in parallel causes race conditions.
