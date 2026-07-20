import { app, BrowserWindow, ipcMain, dialog, session, Menu, MenuItem } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

const isDev = !app.isPackaged;

// Root directory where all novels are stored
const NOVELS_ROOT = path.join(app.getPath('documents'), 'NovelWriter', 'novels');

function ensureRoot() {
  if (!existsSync(NOVELS_ROOT)) {
    mkdirSync(NOVELS_ROOT, { recursive: true });
  }
}

function buildMenu(win: BrowserWindow) {
  const isMac = process.platform === 'darwin';

  const zoomIn = () => {
    win.webContents.zoomLevel = win.webContents.zoomLevel + 0.5;
  };
  const zoomOut = () => {
    win.webContents.zoomLevel = win.webContents.zoomLevel - 0.5;
  };
  const resetZoom = () => {
    win.webContents.zoomLevel = 0;
  };

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: resetZoom,
        },
        {
          label: 'Actual Size (numpad)',
          visible: false,
          acceleratorWorksWhenHidden: true,
          accelerator: 'CmdOrCtrl+num0',
          click: resetZoom,
        },
        {
          // NOTE: '+' is typed as Shift+= on most keyboards, and the
          // accelerator string 'CmdOrCtrl+Plus' does not reliably match
          // that Shift-modified keypress on Windows — it only fires when
          // the menu item is clicked directly. Using the unshifted '='
          // key as the primary accelerator is what actually works from
          // the keyboard; 'Plus' is kept as a hidden fallback in case a
          // given keyboard/layout does send an unmodified '+' keycode.
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: zoomIn,
        },
        {
          label: 'Zoom In (fallback)',
          visible: false,
          acceleratorWorksWhenHidden: true,
          accelerator: 'CmdOrCtrl+Plus',
          click: zoomIn,
        },
        {
          label: 'Zoom In (numpad)',
          visible: false,
          acceleratorWorksWhenHidden: true,
          accelerator: 'CmdOrCtrl+numadd',
          click: zoomIn,
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: zoomOut,
        },
        {
          label: 'Zoom Out (numpad)',
          visible: false,
          acceleratorWorksWhenHidden: true,
          accelerator: 'CmdOrCtrl+numsub',
          click: zoomOut,
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  buildMenu(win);

  // Enable Electron's built-in spellchecker
  win.webContents.session.setSpellCheckerEnabled(true);
  win.webContents.session.setSpellCheckerLanguages(['en-US']);

  // Custom right-click context menu: spelling suggestions, add-to-dictionary,
  // and standard cut/copy/paste so we don't lose default behavior.
  win.webContents.on('context-menu', (_event, params) => {
    const menu = new Menu();

    if (params.misspelledWord) {
      for (const suggestion of params.dictionarySuggestions) {
        menu.append(new MenuItem({
          label: suggestion,
          click: () => win.webContents.replaceMisspelling(suggestion),
        }));
      }
      if (params.dictionarySuggestions.length > 0) {
        menu.append(new MenuItem({ type: 'separator' }));
      }
      menu.append(new MenuItem({
        label: `Add "${params.misspelledWord}" to Dictionary`,
        click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
      }));
      menu.append(new MenuItem({ type: 'separator' }));
    }

    if (params.editFlags.canCut) {
      menu.append(new MenuItem({ label: 'Cut', role: 'cut', enabled: params.editFlags.canCut }));
    }
    if (params.editFlags.canCopy) {
      menu.append(new MenuItem({ label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy }));
    }
    if (params.editFlags.canPaste) {
      menu.append(new MenuItem({ label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste }));
    }

    if (menu.items.length > 0) {
      menu.popup();
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  ensureRoot();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------- IPC: Novel-level operations ----------

ipcMain.handle('novels:list', async () => {
  ensureRoot();
  const entries = await fs.readdir(NOVELS_ROOT, { withFileTypes: true });
  const novels = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const novelPath = path.join(NOVELS_ROOT, entry.name);
      const metaPath = path.join(novelPath, 'novel.json');
      if (existsSync(metaPath)) {
        const data = await fs.readFile(metaPath, 'utf-8');
        novels.push(JSON.parse(data));
      }
    }
  }
  return novels;
});

ipcMain.handle('novels:create', async (_evt, novel) => {
  const novelDir = path.join(NOVELS_ROOT, novel.id);
  await fs.mkdir(path.join(novelDir, 'scenes'), { recursive: true });
  await fs.writeFile(path.join(novelDir, 'novel.json'), JSON.stringify(novel, null, 2));
  await fs.writeFile(path.join(novelDir, 'tags.json'), JSON.stringify([], null, 2));
  return novel;
});

ipcMain.handle('novels:save', async (_evt, novel) => {
  const novelDir = path.join(NOVELS_ROOT, novel.id);
  await fs.writeFile(path.join(novelDir, 'novel.json'), JSON.stringify(novel, null, 2));
  return novel;
});

ipcMain.handle('novels:delete', async (_evt, novelId) => {
  const novelDir = path.join(NOVELS_ROOT, novelId);
  await fs.rm(novelDir, { recursive: true, force: true });
  return true;
});

// ---------- IPC: Scene-level operations ----------

ipcMain.handle('scenes:list', async (_evt, novelId) => {
  const scenesDir = path.join(NOVELS_ROOT, novelId, 'scenes');
  if (!existsSync(scenesDir)) return [];
  const files = await fs.readdir(scenesDir);
  const scenes = [];
  for (const file of files.filter((f) => f.endsWith('.json'))) {
    const data = await fs.readFile(path.join(scenesDir, file), 'utf-8');
    const scene = JSON.parse(data);
    scenes.push(scene);
  }
  // sort by order field
  scenes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return scenes;
});

ipcMain.handle('scenes:save', async (_evt, novelId, scene) => {
  const scenesDir = path.join(NOVELS_ROOT, novelId, 'scenes');
  await fs.mkdir(scenesDir, { recursive: true });
  await fs.writeFile(path.join(scenesDir, `${scene.id}.json`), JSON.stringify(scene, null, 2));
  return scene;
});

ipcMain.handle('scenes:delete', async (_evt, novelId, sceneId) => {
  const scenePath = path.join(NOVELS_ROOT, novelId, 'scenes', `${sceneId}.json`);
  await fs.rm(scenePath, { force: true });
  return true;
});

// ---------- IPC: Tag operations ----------

ipcMain.handle('tags:list', async (_evt, novelId) => {
  const tagsPath = path.join(NOVELS_ROOT, novelId, 'tags.json');
  if (!existsSync(tagsPath)) return [];
  const data = await fs.readFile(tagsPath, 'utf-8');
  return JSON.parse(data);
});

ipcMain.handle('tags:save', async (_evt, novelId, tags) => {
  const tagsPath = path.join(NOVELS_ROOT, novelId, 'tags.json');
  await fs.writeFile(tagsPath, JSON.stringify(tags, null, 2));
  return tags;
});

// ---------- IPC: Spellchecker dictionary ----------

ipcMain.handle('dictionary:list', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return [];
  return win.webContents.session.listWordsInSpellCheckerDictionary();
});

ipcMain.handle('dictionary:add', async (event, word: string) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  return win.webContents.session.addWordToSpellCheckerDictionary(word);
});

ipcMain.handle('dictionary:remove', async (event, word: string) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  return win.webContents.session.removeWordFromSpellCheckerDictionary(word);
});

// ---------- IPC: Misc ----------

ipcMain.handle('app:getNovelsRoot', () => NOVELS_ROOT);

ipcMain.handle('app:revealInFolder', async (_evt, novelId) => {
  const { shell } = require('electron');
  shell.showItemInFolder(path.join(NOVELS_ROOT, novelId, 'novel.json'));
});
