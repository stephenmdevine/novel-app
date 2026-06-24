import { useState } from 'react';
import './HelpModal.css';

interface HelpModalProps {
  onClose: () => void;
}

type HelpTab = 'writing' | 'planning' | 'tags' | 'review' | 'storygrid' | 'storymap';

const TABS: { id: HelpTab; label: string }[] = [
  { id: 'writing',   label: 'Writing & Editing' },
  { id: 'planning',  label: 'Scene Planning' },
  { id: 'tags',      label: 'Tags' },
  { id: 'review',    label: 'Review & To-Dos' },
  { id: 'storygrid', label: 'Story Grid' },
  { id: 'storymap',  label: 'Story Map' },
];

export default function HelpModal({ onClose }: HelpModalProps) {
  const [tab, setTab] = useState<HelpTab>('writing');

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-panel" onClick={(e) => e.stopPropagation()}>

        <div className="help-header">
          <h2>How to Use NovelWriter</h2>
          <button className="help-close" onClick={onClose}>&times;</button>
        </div>

        <div className="help-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`help-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="help-body">

          {tab === 'writing' && (
            <div className="help-section">
              <p className="help-intro">
                The editor is where you write. It auto-saves as you type — your work is never at risk.
              </p>
              <ul>
                <li><strong>Formatting</strong> — Use <kbd>B</kbd>, <kbd>I</kbd>, and <kbd>H2</kbd> in the toolbar, or standard shortcuts: <kbd>Ctrl+B</kbd>, <kbd>Ctrl+I</kbd>.</li>
                <li><strong>Find &amp; Replace</strong> — Press <kbd>Ctrl+F</kbd> or click 🔍 Find. Supports case-sensitive search, single replace, and replace-all. Press <kbd>Escape</kbd> to close.</li>
                <li><strong>Spellcheck</strong> — Right-click any underlined word for spelling suggestions. Choose "Add to Dictionary" to accept a word permanently across all novels.</li>
                <li><strong>Custom Dictionary</strong> — The Dictionary button in the header lets you view, add, and remove words from your personal word list at any time.</li>
                <li><strong>Scenes</strong> — Add scenes with "+ New" in the left panel. Rename them by typing directly in the title field. Drag the <span className="help-mono">⠿</span> handle to reorder. Your scene list and word counts update live.</li>
                <li><strong>Auto-save location</strong> — Novels are stored as plain files at <span className="help-mono">~/Documents/NovelWriter/novels/</span>. Each scene is a separate JSON file you can back up like any other document.</li>
              </ul>
            </div>
          )}

          {tab === 'planning' && (
            <div className="help-section">
              <p className="help-intro">
                The right sidebar has two tabs: Scene Plan for pre-writing notes, and Story Grid for post-draft data. Both persist automatically.
              </p>
              <ul>
                <li><strong>Scene Plan fields</strong> — Write planning notes for each of the six story elements (Inciting Incident, Progressive Complications, Turning Point, Crisis, Climax, Resolution) before or while drafting.</li>
                <li><strong>Anchoring text</strong> — Select a passage in the editor, then click <span className="help-mono">¶ Anchor to Plan</span> in the toolbar. Choose which element it represents. The passage is highlighted in that element's color.</li>
                <li><strong>Jumping to anchored text</strong> — Once a passage is anchored, its label in the Scene Plan tab becomes a clickable button (shown in the element's color with ↗). Click it to scroll directly to that passage.</li>
                <li><strong>One anchor per element</strong> — Each element can anchor exactly one passage. Anchoring a new passage to an element automatically removes the previous anchor for that element.</li>
                <li><strong>Removing an anchor</strong> — Place your cursor inside an anchored passage and click <span className="help-mono">Remove Anchor</span> in the toolbar.</li>
                <li><strong>Must Edit markers</strong> — Select text that needs revision, click <span className="help-mono">✎ Must Edit</span>, and add an optional reminder note. The passage gets a yellow highlight and a linked to-do appears in the Scene To-Do list below the sidebar.</li>
                <li><strong>Resolving markers</strong> — Place your cursor inside a yellow highlighted passage and click <span className="help-mono">✓ Resolve</span>. The highlight clears and the linked to-do is checked off automatically.</li>
              </ul>
            </div>
          )}

          {tab === 'tags' && (
            <div className="help-section">
              <p className="help-intro">
                Tags link named entities — characters, locations, items — to the specific passages where they appear. They act as a live character and world bible inside the manuscript.
              </p>
              <ul>
                <li><strong>Creating a tag</strong> — Select any text in the editor, click <span className="help-mono">Tag Selection</span>, then either choose an existing tag from the list or select "+ New tag from selection" to create one.</li>
                <li><strong>Tag types</strong> — Character, Location, Item, and Other. Each type has a distinct color dot so you can tell them apart at a glance.</li>
                <li><strong>Removing a tag</strong> — Place your cursor inside tagged text and click <span className="help-mono">Remove Tag</span> in the toolbar.</li>
                <li><strong>Renaming</strong> — Open Tags &amp; References from the header and edit the name field. The new name appears everywhere the tag is referenced — no find/replace needed.</li>
                <li><strong>Attributes</strong> — Each tag can hold free-form key/value notes (age, role, eye color, etc.). Click "+ Add attribute" in the tag detail panel to add one. Each attribute can be pinned to the scene where that fact was first established, giving you a jump link back to the source.</li>
                <li><strong>References</strong> — The bottom of the tag detail panel lists every scene that contains that tag. Click any scene title to jump to it.</li>
              </ul>
            </div>
          )}

          {tab === 'review' && (
            <div className="help-section">
              <p className="help-intro">
                The Review Checklist and Scene To-Do list are two separate tools for post-draft quality control. The checklist is for systematic craft review; the to-do list is for specific fixes.
              </p>
              <ul>
                <li><strong>Review Checklist</strong> — Open it from the header after finishing a scene draft. It steps through each item one at a time. Check "Addressed / confirmed" when satisfied, then use Next/Previous or click the dots to navigate.</li>
                <li><strong>Progress tracking</strong> — The progress bar and dot row show at a glance which items have been reviewed and which haven't. Progress is saved per scene.</li>
                <li><strong>Customizing the checklist</strong> — The checklist items are set per novel. To edit them, you currently need to modify the novel's <span className="help-mono">novel.json</span> file directly in <span className="help-mono">~/Documents/NovelWriter/novels/</span>.</li>
                <li><strong>Scene To-Do list</strong> — Lives at the bottom of the right sidebar. Add manual to-dos by typing in the input field and pressing Enter or clicking +.</li>
                <li><strong>Must Edit to-dos</strong> — When you mark text as Must Edit in the editor, a linked to-do is created automatically. Items marked with ✎ are clickable — clicking the label scrolls the editor to the highlighted passage.</li>
                <li><strong>Resolving Must Edit to-dos</strong> — Either click Resolve in the toolbar (with cursor inside the highlight), or check off the to-do item manually. Both clear the yellow highlight.</li>
              </ul>
            </div>
          )}

          {tab === 'storygrid' && (
            <div className="help-section">
              <p className="help-intro">
                The Story Grid tab in the right sidebar collects structured data about each scene's narrative function. Fill it in after drafting when you have a clear sense of what the scene does.
              </p>
              <ul>
                <li><strong>Scene Value</strong> — The value at stake in the genre this scene represents (e.g. Life/Death, Love/Hate). Enter the state at the scene's opening and the state at its close.</li>
                <li><strong>Polarity</strong> — Whether the value shift is positive-to-negative, negative-to-positive, or doubles down in either direction. A novel with healthy rhythm alternates polarities rather than running in the same direction for many scenes.</li>
                <li><strong>Turning Point</strong> — Active turning points are caused by a character's action; Revelatory turning points are caused by a character learning new information. The Turning Point label in the Scene Plan tab will show a ↗ jump link if you've anchored that passage in the editor.</li>
                <li><strong>POV Character</strong> — The character through whose perspective the scene is written. Free text — no need to use a tag.</li>
                <li><strong>Location, Period, Duration</strong> — Where the scene takes place, when it occurs in the story's timeline, and how much time the scene spans.</li>
              </ul>
            </div>
          )}

          {tab === 'storymap' && (
            <div className="help-section">
              <p className="help-intro">
                Story Map compiles your Story Grid data across all scenes into two views. Open it from the header button at any time — it reads live from whatever you've filled in.
              </p>
              <ul>
                <li><strong>Grid Table</strong> — One row per scene showing all Story Grid fields side by side. Click any row to jump directly to that scene. The dot on the right of each row shows whether that scene's Story Grid data is complete (green), partial (amber), or empty (dark).</li>
                <li><strong>Polarity Arc</strong> — A visual chart showing the novel's emotional rhythm. Each scene is a colored line segment sloping up (toward positive) or down (toward negative) based on its polarity. Dashed gray lines connect consecutive scenes. Hover over a segment or block to highlight it; click to jump to that scene.</li>
                <li><strong>Reading the arc</strong> — Segments near the top of the chart represent positive values; segments near the bottom represent negative values. A healthy arc typically shows alternating slopes. A long run of segments all sloping the same direction may signal pacing issues.</li>
                <li><strong>Scenes without data</strong> — Scenes with no polarity set appear as flat gray segments at the midline in the arc view, and show dashes in the table. Fill in the Story Grid tab for each scene to make the map useful.</li>
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
