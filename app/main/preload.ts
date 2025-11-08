import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  openFileDialog: () => ipcRenderer.invoke("file:open-dialog"),
  saveFileDialog: (defaultPath?: string) => ipcRenderer.invoke("file:save-dialog", defaultPath),
  openProject: (filePath?: string) => ipcRenderer.invoke("file:open-project", filePath),
  saveProject: (project: any, filePath?: string) => ipcRenderer.invoke("file:save-project", project, filePath),

  // Project operations
  createNewProject: () => ipcRenderer.invoke("project:create-new"),

  // Media operations
  probeMedia: (filePath: string) => ipcRenderer.invoke("media:probe", filePath),
  detectHardware: () => ipcRenderer.invoke("media:detect-hardware"),

  // Export operations
  startExport: (options: any) => ipcRenderer.invoke("export:start", options),
  cancelExport: (jobId: string) => ipcRenderer.invoke("export:cancel", jobId),
  getExportJob: (jobId: string) => ipcRenderer.invoke("export:get-job", jobId),
  getAllExportJobs: () => ipcRenderer.invoke("export:get-all-jobs"),
  getExportPresets: () => ipcRenderer.invoke("export:get-presets"),

  // Export events
  onExportProgress: (callback: (job: any) => void) => {
    ipcRenderer.on("export:progress", (_event, job) => callback(job));
  },
  onExportComplete: (callback: (job: any) => void) => {
    ipcRenderer.on("export:complete", (_event, job) => callback(job));
  },
  onExportFailed: (callback: (job: any) => void) => {
    ipcRenderer.on("export:failed", (_event, job) => callback(job));
  },
  onExportCancelled: (callback: (job: any) => void) => {
    ipcRenderer.on("export:cancelled", (_event, job) => callback(job));
  },
});

// Type declarations for TypeScript
declare global {
  interface Window {
    electronAPI: {
      openFileDialog: () => Promise<string[] | null>;
      saveFileDialog: (defaultPath?: string) => Promise<string | null>;
      openProject: (filePath?: string) => Promise<{ project: any; filePath: string } | null>;
      saveProject: (project: any, filePath?: string) => Promise<string | null>;
      createNewProject: () => Promise<any>;
      probeMedia: (filePath: string) => Promise<any>;
      detectHardware: () => Promise<{ nvenc: boolean; amf: boolean; quicksync: boolean }>;
      startExport: (options: any) => Promise<string>;
      cancelExport: (jobId: string) => Promise<boolean>;
      getExportJob: (jobId: string) => Promise<any>;
      getAllExportJobs: () => Promise<any[]>;
      getExportPresets: () => Promise<any[]>;
      onExportProgress: (callback: (job: any) => void) => void;
      onExportComplete: (callback: (job: any) => void) => void;
      onExportFailed: (callback: (job: any) => void) => void;
      onExportCancelled: (callback: (job: any) => void) => void;
    };
  }
}
