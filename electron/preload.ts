import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Novels
  listNovels: () => ipcRenderer.invoke('novels:list'),
  createNovel: (novel: any) => ipcRenderer.invoke('novels:create', novel),
  saveNovel: (novel: any) => ipcRenderer.invoke('novels:save', novel),
  deleteNovel: (novelId: string) => ipcRenderer.invoke('novels:delete', novelId),

  // Scenes
  listScenes: (novelId: string) => ipcRenderer.invoke('scenes:list', novelId),
  saveScene: (novelId: string, scene: any) => ipcRenderer.invoke('scenes:save', novelId, scene),
  deleteScene: (novelId: string, sceneId: string) =>
    ipcRenderer.invoke('scenes:delete', novelId, sceneId),

  // Tags
  listTags: (novelId: string) => ipcRenderer.invoke('tags:list', novelId),
  saveTags: (novelId: string, tags: any) => ipcRenderer.invoke('tags:save', novelId, tags),

  // Misc
  getNovelsRoot: () => ipcRenderer.invoke('app:getNovelsRoot'),
  revealInFolder: (novelId: string) => ipcRenderer.invoke('app:revealInFolder', novelId),
});
