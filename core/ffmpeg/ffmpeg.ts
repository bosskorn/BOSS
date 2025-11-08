// FFmpeg wrapper for OneCut Studio
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import type { MediaItem, ExportSettings, Project } from '../types/project';

export class FFmpegWrapper {
  private ffmpegPath: string;
  private ffprobePath: string;

  constructor() {
    // In production, bundle FFmpeg binaries with the app
    this.ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    this.ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';
  }

  /**
   * Probe media file to get metadata
   */
  async probeMedia(filePath: string): Promise<Partial<MediaItem>> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ];

      const process = spawn(this.ffprobePath, args);
      let output = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFprobe failed with code ${code}`));
          return;
        }

        try {
          const data = JSON.parse(output);
          const videoStream = data.streams.find((s: any) => s.codec_type === 'video');
          const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');
          
          resolve({
            duration: parseFloat(data.format.duration) || 0,
            fps: videoStream ? this.parseFps(videoStream.r_frame_rate) : undefined,
            width: videoStream?.width,
            height: videoStream?.height,
            codec: videoStream?.codec_name || audioStream?.codec_name,
          });
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Parse frame rate string (e.g., "30/1" -> 30)
   */
  private parseFps(fpsString: string): number {
    const parts = fpsString.split('/');
    return parseFloat(parts[0]) / parseFloat(parts[1]);
  }

  /**
   * Fast merge using copy codec (no re-encoding)
   */
  async fastMerge(
    inputFiles: string[],
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // Create concat file list
    const listPath = path.join(path.dirname(outputPath), 'concat_list.txt');
    const listContent = inputFiles.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
    await fs.writeFile(listPath, listContent);

    return new Promise((resolve, reject) => {
      const args = [
        '-f', 'concat',
        '-safe', '0',
        '-i', listPath,
        '-c', 'copy',
        '-y',
        outputPath
      ];

      const process = spawn(this.ffmpegPath, args);
      
      this.handleProgress(process, onProgress);

      process.on('close', async (code) => {
        // Clean up concat list
        await fs.unlink(listPath).catch(() => {});
        
        if (code !== 0) {
          reject(new Error(`FFmpeg failed with code ${code}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Export with encoding
   */
  async export(
    project: Project,
    settings: ExportSettings,
    onProgress?: (progress: any) => void
  ): Promise<void> {
    const args = this.buildExportArgs(project, settings);

    return new Promise((resolve, reject) => {
      const process = spawn(this.ffmpegPath, args);
      
      this.handleProgress(process, onProgress, project.sequence.tracks.video[0]?.out || 0);

      let errorOutput = '';
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg export failed: ${errorOutput}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Build FFmpeg arguments for export
   */
  private buildExportArgs(project: Project, settings: ExportSettings): string[] {
    const args: string[] = [];
    const { preset, outputPath } = settings;

    // Add input files
    const videoClips = project.sequence.tracks.video;
    const audioClips = project.sequence.tracks.audio;

    // For MVP: simple single video + audio mix
    if (videoClips.length > 0) {
      const videoMedia = project.media.find(m => m.id === videoClips[0].mediaId);
      if (videoMedia) {
        args.push('-i', videoMedia.path);
      }
    }

    if (audioClips.length > 0) {
      const audioMedia = project.media.find(m => m.id === audioClips[0].mediaId);
      if (audioMedia) {
        args.push('-i', audioMedia.path);
      }
    }

    // Build filter complex for audio mixing
    const audioFilters: string[] = [];
    audioClips.forEach((clip, idx) => {
      const filters = [`[${idx + 1}:a]`];
      
      if (clip.gainDb !== undefined) {
        filters.push(`volume=${Math.pow(10, clip.gainDb / 20)}`);
      }
      
      if (clip.fadeIn) {
        filters.push(`afade=t=in:st=${clip.in}:d=${clip.fadeIn}`);
      }
      
      if (clip.fadeOut) {
        filters.push(`afade=t=out:st=${clip.out - clip.fadeOut}:d=${clip.fadeOut}`);
      }
      
      filters.push(`loudnorm=I=-16:TP=-1.5:LRA=11`);
      audioFilters.push(filters.join(','));
    });

    if (audioFilters.length > 0) {
      args.push('-filter_complex', audioFilters.join(';'));
    }

    // Video codec settings
    if (preset.codec === 'copy') {
      args.push('-c:v', 'copy');
    } else if (preset.codec === 'h264') {
      args.push('-c:v', 'libx264');
      if (preset.crf) args.push('-crf', preset.crf.toString());
      if (preset.preset) args.push('-preset', preset.preset);
      if (preset.videoBitrate) args.push('-b:v', preset.videoBitrate);
      args.push('-pix_fmt', 'yuv420p');
    } else if (preset.codec === 'h264_nvenc') {
      args.push('-c:v', 'h264_nvenc');
      args.push('-rc', 'vbr');
      if (preset.crf) args.push('-cq', preset.crf.toString());
      if (preset.videoBitrate) args.push('-b:v', preset.videoBitrate);
      args.push('-pix_fmt', 'yuv420p');
    }

    // Audio codec settings
    if (preset.audioCodec === 'copy') {
      args.push('-c:a', 'copy');
    } else if (preset.audioCodec === 'aac') {
      args.push('-c:a', 'aac');
      if (preset.audioBitrate) args.push('-b:a', preset.audioBitrate);
    }

    // Resolution
    if (preset.resolution) {
      args.push('-s', `${preset.resolution.width}x${preset.resolution.height}`);
    }

    // FPS
    if (preset.fps) {
      args.push('-r', preset.fps.toString());
    }

    // Progress output
    args.push('-progress', 'pipe:1');
    
    // Overwrite
    args.push('-y');
    
    // Output
    args.push(outputPath);

    return args;
  }

  /**
   * Handle progress parsing
   */
  private handleProgress(
    process: ChildProcess,
    onProgress?: (progress: any) => void,
    totalDuration?: number
  ): void {
    if (!onProgress) return;

    let buffer = '';
    
    process.stdout?.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const [key, value] = line.split('=');
        if (key === 'out_time_ms') {
          const currentTime = parseFloat(value) / 1000000; // Convert microseconds to seconds
          if (totalDuration) {
            const progress = Math.min((currentTime / totalDuration) * 100, 100);
            onProgress({ progress, currentTime, totalTime: totalDuration });
          }
        }
      }
    });
  }

  /**
   * Check for hardware acceleration support
   */
  async checkHardwareAccel(): Promise<{
    nvenc: boolean;
    qsv: boolean;
    amf: boolean;
  }> {
    return new Promise((resolve) => {
      const process = spawn(this.ffmpegPath, ['-encoders']);
      let output = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', () => {
        resolve({
          nvenc: output.includes('h264_nvenc'),
          qsv: output.includes('h264_qsv'),
          amf: output.includes('h264_amf'),
        });
      });
    });
  }
}

export const ffmpeg = new FFmpegWrapper();
