const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, safe API surface for use in the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  getEnv: async (key) => {
    return await ipcRenderer.invoke('app:get-env', key);
  },
  gemini: {
    fetchSpectralData: async (query) => await ipcRenderer.invoke('gemini:fetchSpectralData', query),
    analyzeSpectra: async (datasets) => await ipcRenderer.invoke('gemini:analyzeSpectra', datasets)
  }
  ,
  store: {
    get: async (key) => await ipcRenderer.invoke('app:store:get', key),
    set: async (key, value) => await ipcRenderer.invoke('app:store:set', key, value),
  }
});
