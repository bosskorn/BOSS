// Electron main process for OneCut Studio
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { ffmpeg } from '../../core/ffmpeg/ffmpeg.js';
import { projectManager } from '../../core/project/projectManager.js';
import { jobQueue } from '../../core/jobs/jobQueue.js';
import type { Project, ExportSettings, MediaItem } from '../../core/types/project';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1a1a1a',
    title: 'OneCut Studio',
    show: false,
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ============================================
// IPC Handlers
// ============================================

// File dialogs
ipcMain.handle('dialog:openFile', async (_event, filters?: any[]) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: filters || [
      { name: 'Media Files', extensions: ['mp4', 'mov', 'mkv', 'webm', 'mp3', 'wav', 'aac'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  return result.filePaths;
});

ipcMain.handle('dialog:openProject', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'OneCut Project', extensions: ['onecut.json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  return result.filePaths[0];
});

ipcMain.handle('dialog:saveProject', async (_event, defaultName?: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName || 'untitled.onecut.json',
    filters: [
      { name: 'OneCut Project', extensions: ['onecut.json'] },
    ],
  });

  return result.filePath;
});

ipcMain.handle('dialog:saveFile', async (_event, defaultName?: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName || 'output.mp4',
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mov', 'mkv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  return result.filePath;
});

// Media operations
ipcMain.handle('media:probe', async (_event, filePath: string) => {
  try {
    return await ffmpeg.probeMedia(filePath);
  } catch (error) {
    throw new Error(`Failed to probe media: ${error}`);
  }
});

ipcMain.handle('media:checkHardwareAccel', async () => {
  return await ffmpeg.checkHardwareAccel();
});

// Project operations
ipcMain.handle('project:new', () => {
  return projectManager.createNewProject();
});

ipcMain.handle('project:save', async (_event, project: Project, filePath: string) => {
  try {
    await projectManager.saveProject(project, filePath);
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to save project: ${error}`);
  }
});

ipcMain.handle('project:load', async (_event, filePath: string) => {
  try {
    return await projectManager.loadProject(filePath);
  } catch (error) {
    throw new Error(`Failed to load project: ${error}`);
  }
});

ipcMain.handle('project:autoSave', async (_event, project: Project) => {
  try {
    await projectManager.autoSave(project);
  } catch (error) {
    console.error('Auto-save failed:', error);
  }
});

// Export operations
ipcMain.handle('export:start', async (_event, project: Project, settings: ExportSettings) => {
  try {
    const jobId = jobQueue.addExportJob(project, settings);
    return { success: true, jobId };
  } catch (error) {
    throw new Error(`Failed to start export: ${error}`);
  }
});

ipcMain.handle('export:cancel', (_event, jobId: string) => {
  return jobQueue.cancelJob(jobId);
});

ipcMain.handle('export:getJob', (_event, jobId: string) => {
  return jobQueue.getJob(jobId);
});

ipcMain.handle('export:getAllJobs', () => {
  return jobQueue.getAllJobs();
});

ipcMain.handle('export:clearCompleted', () => {
  jobQueue.clearCompletedJobs();
});

// Forward job events to renderer
jobQueue.on('jobAdded', (job) => {
  mainWindow?.webContents.send('job:added', job);
});

jobQueue.on('jobUpdated', (job) => {
  mainWindow?.webContents.send('job:updated', job);
});

jobQueue.on('jobProgress', (progress) => {
  mainWindow?.webContents.send('job:progress', progress);
});

// System info
ipcMain.handle('system:getInfo', () => {
  return {
    platform: process.platform,
    version: app.getVersion(),
    electronVersion: process.versions.electron,
  };
});
