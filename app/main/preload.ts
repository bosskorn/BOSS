// Preload script for OneCut Studio
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Dialog APIs
  openFileDialog: (filters?: any[]) => ipcRenderer.invoke('dialog:openFile', filters),
  openProjectDialog: () => ipcRenderer.invoke('dialog:openProject'),
  saveProjectDialog: (defaultName?: string) => ipcRenderer.invoke('dialog:saveProject', defaultName),
  saveFileDialog: (defaultName?: string) => ipcRenderer.invoke('dialog:saveFile', defaultName),

  // Media APIs
  probeMedia: (filePath: string) => ipcRenderer.invoke('media:probe', filePath),
  checkHardwareAccel: () => ipcRenderer.invoke('media:checkHardwareAccel'),

  // Project APIs
  newProject: () => ipcRenderer.invoke('project:new'),
  saveProject: (project: any, filePath: string) => ipcRenderer.invoke('project:save', project, filePath),
  loadProject: (filePath: string) => ipcRenderer.invoke('project:load', filePath),
  autoSaveProject: (project: any) => ipcRenderer.invoke('project:autoSave', project),

  // Export APIs
  startExport: (project: any, settings: any) => ipcRenderer.invoke('export:start', project, settings),
  cancelExport: (jobId: string) => ipcRenderer.invoke('export:cancel', jobId),
  getJob: (jobId: string) => ipcRenderer.invoke('export:getJob', jobId),
  getAllJobs: () => ipcRenderer.invoke('export:getAllJobs'),
  clearCompletedJobs: () => ipcRenderer.invoke('export:clearCompleted'),

  // Event listeners
  onJobAdded: (callback: (job: any) => void) => {
    ipcRenderer.on('job:added', (_event, job) => callback(job));
  },
  onJobUpdated: (callback: (job: any) => void) => {
    ipcRenderer.on('job:updated', (_event, job) => callback(job));
  },
  onJobProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('job:progress', (_event, progress) => callback(progress));
  },

  // System APIs
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),
});

// Type definitions for TypeScript
export interface ElectronAPI {
  openFileDialog: (filters?: any[]) => Promise<string[]>;
  openProjectDialog: () => Promise<string>;
  saveProjectDialog: (defaultName?: string) => Promise<string>;
  saveFileDialog: (defaultName?: string) => Promise<string>;
  probeMedia: (filePath: string) => Promise<any>;
  checkHardwareAccel: () => Promise<any>;
  newProject: () => Promise<any>;
  saveProject: (project: any, filePath: string) => Promise<any>;
  loadProject: (filePath: string) => Promise<any>;
  autoSaveProject: (project: any) => Promise<void>;
  startExport: (project: any, settings: any) => Promise<any>;
  cancelExport: (jobId: string) => Promise<boolean>;
  getJob: (jobId: string) => Promise<any>;
  getAllJobs: () => Promise<any[]>;
  clearCompletedJobs: () => Promise<void>;
  onJobAdded: (callback: (job: any) => void) => void;
  onJobUpdated: (callback: (job: any) => void) => void;
  onJobProgress: (callback: (progress: any) => void) => void;
  getSystemInfo: () => Promise<any>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
