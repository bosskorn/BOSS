// TypeScript definitions for Electron API
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

export {};
