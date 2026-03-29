import { contextBridge, ipcRenderer } from "electron";

/**
 * Expose a safe IPC bridge to the renderer process.
 * The Next.js app can call window.kllapp.* methods.
 */
contextBridge.exposeInMainWorld("kllapp", {
  // Platform info
  platform: process.platform,
  isDesktop: true,

  // App info
  getVersion: () => ipcRenderer.invoke("app:version"),
  getDataPath: () => ipcRenderer.invoke("app:data-path"),

  // Window controls (for custom titlebar if needed)
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),

  // Database
  exportData: () => ipcRenderer.invoke("db:export"),
  importData: (data: string) => ipcRenderer.invoke("db:import", data),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  onUpdateAvailable: (callback: (info: unknown) => void) => {
    ipcRenderer.on("update:available", (_event, info) => callback(info));
  },
});
