import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: async () => {
    return await ipcRenderer.invoke('health:ping');
  },
  // Will be wired in the API proxy task:
  generateContent: (payload: { prompt: string; type: string; tone?: string }) =>
    ipcRenderer.invoke('ai:generate', payload)
  ,
  startStream: (payload: { prompt: string; type: string; tone?: string }) =>
    ipcRenderer.invoke('ai:generate-stream', payload),
  onStreamChunk: (cb: (data: { delta?: string; done?: boolean }) => void) => {
    const listener = (_: any, data: { delta?: string; done?: boolean }) => cb(data);
    ipcRenderer.on('ai:stream:chunk', listener);
    return () => ipcRenderer.removeListener('ai:stream:chunk', listener);
  },
  exportHtml: (args: { projectId?: string; content: string; name?: string }) =>
    ipcRenderer.invoke('export:html', args),
  exportMarkdown: (args: { projectId?: string; content: string; name?: string }) =>
    ipcRenderer.invoke('export:markdown', args),
  exportJson: (args: { projectId?: string; data: any; name?: string }) =>
    ipcRenderer.invoke('export:json', args),
  exportPdf: (args: { projectId?: string; html: string; name?: string }) =>
    ipcRenderer.invoke('export:pdf', args),
  saveProject: (args: { id?: string; name: string; type: string; content: string; favorite?: boolean }) =>
    ipcRenderer.invoke('project:save', args),
  listProjects: () =>
    ipcRenderer.invoke('project:list'),
  saveBrandProfile: (args: { name: string; sample: string }) =>
    ipcRenderer.invoke('brand:saveProfile', args),
  listBrandProfiles: () =>
    ipcRenderer.invoke('brand:listProfiles')
});
