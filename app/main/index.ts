import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  loadProject,
  saveProject,
  createNewProject,
  Project,
  MediaItem,
  FFmpegProcess,
  jobQueue,
  ExportJob,
  DEFAULT_EXPORT_PRESETS,
} from "@core/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const isDev = process.env.NODE_ENV === "development";
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: isDev
        ? join(process.cwd(), "app", "main", "preload.js")
        : join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: "hiddenInset",
    backgroundColor: "#1a1a1a",
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC Handlers

// File operations
ipcMain.handle("file:open-dialog", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Media Files", extensions: ["mp4", "mov", "mkv", "webm", "mp3", "wav", "aac", "srt", "ass"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  return result.canceled ? null : result.filePaths;
});

ipcMain.handle("file:save-dialog", async (_event, defaultPath?: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultPath || "output.mp4",
    filters: [
      { name: "Video Files", extensions: ["mp4", "mov", "mkv"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  return result.canceled ? null : result.filePath;
});

ipcMain.handle("file:open-project", async (_event, filePath?: string) => {
  if (!filePath) {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openFile"],
      filters: [{ name: "OneCut Project", extensions: ["onecut.json"] }],
    });
    if (result.canceled) return null;
    filePath = result.filePaths[0];
  }

  try {
    const project = await loadProject({ projectPath: filePath });
    return { project, filePath };
  } catch (error) {
    throw new Error(`Failed to load project: ${error instanceof Error ? error.message : String(error)}`);
  }
});

ipcMain.handle("file:save-project", async (_event, project: Project, filePath?: string) => {
  if (!filePath) {
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: "project.onecut.json",
      filters: [{ name: "OneCut Project", extensions: ["onecut.json"] }],
    });
    if (result.canceled) return null;
    filePath = result.filePaths[0];
  }

  try {
    await saveProject(project, { projectPath: filePath });
    return filePath;
  } catch (error) {
    throw new Error(`Failed to save project: ${error instanceof Error ? error.message : String(error)}`);
  }
});

// Project operations
ipcMain.handle("project:create-new", async () => {
  return createNewProject();
});

// Media operations
ipcMain.handle("media:probe", async (_event, filePath: string) => {
  try {
    const metadata = await FFmpegProcess.probeMedia(filePath);
    return metadata;
  } catch (error) {
    throw new Error(`Failed to probe media: ${error instanceof Error ? error.message : String(error)}`);
  }
});

ipcMain.handle("media:detect-hardware", async () => {
  try {
    return await FFmpegProcess.detectHardwareAccel();
  } catch (error) {
    return { nvenc: false, amf: false, quicksync: false };
  }
});

// Export operations
ipcMain.handle("export:start", async (_event, options: {
  projectPath: string;
  outputPath: string;
  presetId: string;
  inputFiles: string[];
  videoCodec?: string;
  audioCodec?: string;
  width?: number;
  height?: number;
  fps?: number;
  crf?: number;
  preset?: string;
  bitrate?: string;
  hardwareAccel?: boolean;
  copyCodec?: boolean;
  subtitleFile?: string;
  subtitleFont?: string;
  subtitleSize?: number;
  subtitleY?: number;
  audioGain?: number;
  audioFadeIn?: number;
  audioFadeOut?: number;
  audioLoudnorm?: boolean;
  overlayImage?: string;
  overlayX?: number;
  overlayY?: number;
}) => {
  const preset = DEFAULT_EXPORT_PRESETS.find((p) => p.id === options.presetId) || DEFAULT_EXPORT_PRESETS[0];

  const jobId = await jobQueue.addJob(
    options.projectPath,
    options.outputPath,
    preset,
    {
      inputFiles: options.inputFiles,
      outputFile: options.outputPath,
      videoCodec: options.videoCodec || preset.videoCodec,
      audioCodec: options.audioCodec || preset.audioCodec,
      width: options.width || preset.width,
      height: options.height || preset.height,
      fps: options.fps || preset.fps,
      crf: options.crf || preset.crf,
      preset: options.preset || preset.preset,
      bitrate: options.bitrate || preset.bitrate,
      hardwareAccel: options.hardwareAccel ?? preset.hardwareAccel,
      copyCodec: options.copyCodec ?? preset.copyCodec,
      subtitleFile: options.subtitleFile,
      subtitleFont: options.subtitleFont || preset.subtitleFont,
      subtitleSize: options.subtitleSize,
      subtitleY: options.subtitleY,
      audioGain: options.audioGain,
      audioFadeIn: options.audioFadeIn,
      audioFadeOut: options.audioFadeOut,
      audioLoudnorm: options.audioLoudnorm,
      overlayImage: options.overlayImage,
      overlayX: options.overlayX,
      overlayY: options.overlayY,
    }
  );

  return jobId;
});

ipcMain.handle("export:cancel", async (_event, jobId: string) => {
  return jobQueue.cancelJob(jobId);
});

ipcMain.handle("export:get-job", async (_event, jobId: string) => {
  return jobQueue.getJob(jobId);
});

ipcMain.handle("export:get-all-jobs", async () => {
  return jobQueue.getAllJobs();
});

ipcMain.handle("export:get-presets", async () => {
  return DEFAULT_EXPORT_PRESETS;
});

// Set up job progress events
jobQueue.on("job:progress", (job: ExportJob) => {
  mainWindow?.webContents.send("export:progress", job);
});

jobQueue.on("job:complete", (job: ExportJob) => {
  mainWindow?.webContents.send("export:complete", job);
});

jobQueue.on("job:failed", (job: ExportJob) => {
  mainWindow?.webContents.send("export:failed", job);
});

jobQueue.on("job:cancelled", (job: ExportJob) => {
  mainWindow?.webContents.send("export:cancelled", job);
});
