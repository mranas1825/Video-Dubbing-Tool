const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getFilePath: (file) => webUtils.getPathForFile(file),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getFolderContents: (filePath) => ipcRenderer.invoke('get-folder-contents', filePath),
  downloadVideoLink: (url) => ipcRenderer.invoke('download-video-link', url),
  runPipelineTask: (taskData) => ipcRenderer.invoke('run-pipeline-task', taskData),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getPresets: () => ipcRenderer.invoke('get-presets'),
  savePreset: (preset) => ipcRenderer.invoke('save-preset', preset),
  fetchElevenLabsVoice: (data) => ipcRenderer.invoke('fetch-elevenlabs-voice', data),
  validateApiKey: (data) => ipcRenderer.invoke('validate-api-key', data),
  onLogUpdate: (callback) => {
    const subscription = (event, value) => callback(value);
    ipcRenderer.on('log-update', subscription);
    return () => ipcRenderer.removeListener('log-update', subscription);
  },
  onTaskProgress: (callback) => {
    const subscription = (event, value) => callback(value);
    ipcRenderer.on('task-progress', subscription);
    return () => ipcRenderer.removeListener('task-progress', subscription);
  }
});
