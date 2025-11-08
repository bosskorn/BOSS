import { useState, useEffect } from "react";
import { Project, ExportPreset } from "@core/index";
import { X, Play, Square } from "lucide-react";

interface ExportPanelProps {
  project: Project;
  onClose: () => void;
}

export default function ExportPanel({ project, onClose }: ExportPanelProps) {
  const [presets, setPresets] = useState<ExportPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("fast-merge");
  const [outputPath, setOutputPath] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [hardwareAccel, setHardwareAccel] = useState({
    nvenc: false,
    amf: false,
    quicksync: false,
  });

  useEffect(() => {
    loadPresets();
    detectHardware();
  }, []);

  useEffect(() => {
    if (exportJobId) {
      const handleProgress = (job: any) => {
        if (job.id === exportJobId && job.progress) {
          // Calculate progress percentage (simplified)
          setProgress(50); // Placeholder
        }
      };

      const handleComplete = (job: any) => {
        if (job.id === exportJobId) {
          setIsExporting(false);
          setProgress(100);
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      };

      const handleFailed = (job: any) => {
        if (job.id === exportJobId) {
          setIsExporting(false);
          alert(`Export failed: ${job.error}`);
        }
      };

      window.electronAPI.onExportProgress(handleProgress);
      window.electronAPI.onExportComplete(handleComplete);
      window.electronAPI.onExportFailed(handleFailed);

      return () => {
        // Cleanup listeners if needed
      };
    }
  }, [exportJobId]);

  const loadPresets = async () => {
    const loadedPresets = await window.electronAPI.getExportPresets();
    setPresets(loadedPresets);
  };

  const detectHardware = async () => {
    const hw = await window.electronAPI.detectHardware();
    setHardwareAccel(hw);
  };

  const handleSelectOutput = async () => {
    const path = await window.electronAPI.saveFileDialog("output.mp4");
    if (path) {
      setOutputPath(path);
    }
  };

  const handleStartExport = async () => {
    if (!outputPath) {
      alert("Please select an output file");
      return;
    }

    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) return;

    // Collect all media files from project
    const videoFiles = project.sequence.tracks.video
      .map((clip) => {
        const media = project.media.find((m) => m.id === clip.mediaId);
        return media?.path;
      })
      .filter(Boolean) as string[];

    const audioFiles = project.sequence.tracks.audio
      .map((clip) => {
        const media = project.media.find((m) => m.id === clip.mediaId);
        return media?.path;
      })
      .filter(Boolean) as string[];

    const inputFiles = [...new Set([...videoFiles, ...audioFiles])];

    if (inputFiles.length === 0) {
      alert("No media files to export");
      return;
    }

    // Get subtitle file if any
    const subtitleFile = project.sequence.subtitles[0]?.path;

    // Get first audio clip for audio settings
    const firstAudioClip = project.sequence.tracks.audio[0];

    setIsExporting(true);
    setProgress(0);

    try {
      const jobId = await window.electronAPI.startExport({
        projectPath: "", // Will be set if project is saved
        outputPath,
        presetId: selectedPresetId,
        inputFiles,
        videoCodec: preset.videoCodec,
        audioCodec: preset.audioCodec,
        width: preset.width,
        height: preset.height,
        fps: preset.fps,
        crf: preset.crf,
        preset: preset.preset,
        bitrate: preset.bitrate,
        hardwareAccel: preset.hardwareAccel && (hardwareAccel.nvenc || hardwareAccel.amf || hardwareAccel.quicksync),
        copyCodec: preset.copyCodec,
        subtitleFile,
        subtitleFont: project.sequence.subtitles[0]?.font,
        subtitleSize: project.sequence.subtitles[0]?.size,
        subtitleY: project.sequence.subtitles[0]?.y,
        audioGain: firstAudioClip?.gainDb,
        audioFadeIn: firstAudioClip?.fadeIn,
        audioFadeOut: firstAudioClip?.fadeOut,
        audioLoudnorm: false, // Can be enabled via UI
      });

      setExportJobId(jobId);
    } catch (error) {
      setIsExporting(false);
      alert(`Failed to start export: ${error}`);
    }
  };

  const handleCancelExport = async () => {
    if (exportJobId) {
      await window.electronAPI.cancelExport(exportJobId);
      setIsExporting(false);
      setExportJobId(null);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Export</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent"
            disabled={isExporting}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Preset Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Export Preset</label>
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded bg-background"
              disabled={isExporting}
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            {presets.find((p) => p.id === selectedPresetId)?.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {presets.find((p) => p.id === selectedPresetId)?.description}
              </p>
            )}
          </div>

          {/* Output Path */}
          <div>
            <label className="text-sm font-medium mb-2 block">Output File</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={outputPath}
                readOnly
                className="flex-1 px-3 py-2 border border-border rounded bg-background"
                placeholder="Select output file..."
              />
              <button
                onClick={handleSelectOutput}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded"
                disabled={isExporting}
              >
                Browse
              </button>
            </div>
          </div>

          {/* Hardware Acceleration Info */}
          {(hardwareAccel.nvenc || hardwareAccel.amf || hardwareAccel.quicksync) && (
            <div className="text-xs text-muted-foreground">
              Hardware acceleration available:{" "}
              {[
                hardwareAccel.nvenc && "NVENC",
                hardwareAccel.amf && "AMF",
                hardwareAccel.quicksync && "QuickSync",
              ]
                .filter(Boolean)
                .join(", ")}
            </div>
          )}

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Exporting...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          {isExporting ? (
            <button
              onClick={handleCancelExport}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExport}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-2"
                disabled={!outputPath}
              >
                <Play className="w-4 h-4" />
                Start Export
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
