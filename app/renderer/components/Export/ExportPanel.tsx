// Export panel component - configure and start export
import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Download, CheckCircle2, AlertCircle, X } from 'lucide-react';
import type { ExportSettings, ExportPreset } from '../../../../core/types/project';

const PRESETS: Record<string, ExportPreset> = {
  fastMerge: {
    name: 'Fast Merge (Copy)',
    codec: 'copy',
    audioCodec: 'copy',
  },
  youtube1080p: {
    name: 'YouTube 1080p',
    codec: 'h264',
    audioCodec: 'aac',
    crf: 18,
    preset: 'medium',
    audioBitrate: '192k',
    resolution: { width: 1920, height: 1080 },
  },
  youtube1080pNvenc: {
    name: 'YouTube 1080p (NVENC)',
    codec: 'h264_nvenc',
    audioCodec: 'aac',
    crf: 19,
    videoBitrate: '6M',
    audioBitrate: '192k',
    resolution: { width: 1920, height: 1080 },
    hwAccel: true,
  },
  mobile720p: {
    name: 'Mobile 720p',
    codec: 'h264',
    audioCodec: 'aac',
    crf: 21,
    preset: 'medium',
    audioBitrate: '128k',
    resolution: { width: 1280, height: 720 },
    fps: 30,
  },
};

export function ExportPanel() {
  const { project } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const [presetKey, setPresetKey] = useState('youtube1080p');
  const [fileName, setFileName] = useState('output.mp4');
  const [outputPath, setOutputPath] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hwAccelSupport, setHwAccelSupport] = useState({ nvenc: false, qsv: false, amf: false });

  useEffect(() => {
    // Check hardware acceleration support
    window.electron.checkHardwareAccel().then(setHwAccelSupport);
  }, []);

  useEffect(() => {
    // Listen for job updates
    window.electron.onJobProgress((progressData) => {
      if (progressData.jobId === jobId) {
        setProgress(progressData.progress || 0);
      }
    });

    window.electron.onJobUpdated((job) => {
      if (job.id === jobId) {
        if (job.status === 'done') {
          setExportStatus('done');
          setIsExporting(false);
          setProgress(100);
        } else if (job.status === 'failed') {
          setExportStatus('error');
          setErrorMessage(job.error || 'Export failed');
          setIsExporting(false);
        }
      }
    });
  }, [jobId]);

  const handleSelectOutputPath = async () => {
    const path = await window.electron.saveFileDialog(fileName);
    if (path) {
      setOutputPath(path);
      setFileName(path.split('/').pop() || 'output.mp4');
    }
  };

  const handleExport = async () => {
    if (!project || !outputPath) return;

    setIsExporting(true);
    setExportStatus('exporting');
    setProgress(0);
    setErrorMessage('');

    try {
      const settings: ExportSettings = {
        preset: PRESETS[presetKey],
        outputPath,
        fileName,
      };

      const result = await window.electron.startExport(project, settings);
      if (result.success) {
        setJobId(result.jobId);
      }
    } catch (error: any) {
      setExportStatus('error');
      setErrorMessage(error.message || 'Failed to start export');
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    if (jobId) {
      window.electron.cancelExport(jobId);
    }
    setIsOpen(false);
    setIsExporting(false);
    setExportStatus('idle');
    setProgress(0);
  };

  const getPresetOptions = () => {
    const options = Object.entries(PRESETS).map(([key, preset]) => {
      // Filter out NVENC option if not supported
      if (preset.hwAccel && !hwAccelSupport.nvenc) {
        return null;
      }
      return (
        <SelectItem key={key} value={key}>
          {preset.name}
        </SelectItem>
      );
    });

    return options.filter(Boolean);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={!project}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preset selection */}
          <div>
            <Label htmlFor="preset">Export Preset</Label>
            <Select value={presetKey} onValueChange={setPresetKey} disabled={isExporting}>
              <SelectTrigger id="preset" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getPresetOptions()}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500 mt-1">
              {PRESETS[presetKey].codec === 'copy'
                ? 'Fast merge without re-encoding'
                : `${PRESETS[presetKey].codec.toUpperCase()} + ${PRESETS[presetKey].audioCodec.toUpperCase()}`}
            </p>
          </div>

          {/* File name */}
          <div>
            <Label htmlFor="filename">File Name</Label>
            <Input
              id="filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              disabled={isExporting}
              className="mt-1"
            />
          </div>

          {/* Output path */}
          <div>
            <Label htmlFor="output">Output Location</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="output"
                value={outputPath}
                readOnly
                placeholder="Click 'Browse' to select"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectOutputPath}
                disabled={isExporting}
              >
                Browse
              </Button>
            </div>
          </div>

          {/* Hardware acceleration notice */}
          {hwAccelSupport.nvenc && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-sm text-green-400">
              ✓ NVIDIA hardware acceleration available
            </div>
          )}

          {/* Progress */}
          {isExporting && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Exporting...</Label>
                <span className="text-sm text-zinc-400">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Status messages */}
          {exportStatus === 'done' && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded text-sm text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              Export completed successfully!
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              {isExporting ? 'Cancel' : 'Close'}
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || !outputPath || exportStatus === 'done'}
            >
              {isExporting ? 'Exporting...' : 'Start Export'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
