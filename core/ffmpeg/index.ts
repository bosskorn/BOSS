import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { platform } from "os";

export interface FFmpegProgress {
  frame?: number;
  fps?: number;
  bitrate?: string;
  totalSize?: number;
  outTimeMs?: number;
  outTime?: string;
  dupFrames?: number;
  dropFrames?: number;
  speed?: string;
  progress?: number; // 0-100
}

export interface FFmpegOptions {
  inputFiles: string[];
  outputFile: string;
  videoCodec?: string;
  audioCodec?: string;
  filters?: string[];
  hardwareAccel?: boolean;
  copyCodec?: boolean;
  width?: number;
  height?: number;
  fps?: number;
  crf?: number;
  preset?: string;
  bitrate?: string;
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
}

export class FFmpegProcess extends EventEmitter {
  private process: ChildProcess | null = null;
  private isRunning = false;

  /**
   * Detect available hardware acceleration
   */
  static async detectHardwareAccel(): Promise<{
    nvenc: boolean;
    amf: boolean;
    quicksync: boolean;
  }> {
    const os = platform();
    const result = {
      nvenc: false,
      amf: false,
      quicksync: false,
    };

    try {
      // Try to detect NVENC (NVIDIA)
      const nvencCheck = spawn("ffmpeg", [
        "-hide_banner",
        "-encoders",
      ]);
      let output = "";
      nvencCheck.stdout?.on("data", (data) => {
        output += data.toString();
      });
      await new Promise((resolve) => {
        nvencCheck.on("close", resolve);
      });

      result.nvenc = output.includes("h264_nvenc");
      result.amf = output.includes("h264_amf");
      result.quicksync = output.includes("h264_qsv");
    } catch (error) {
      // FFmpeg might not be installed or accessible
      console.warn("Could not detect hardware acceleration:", error);
    }

    return result;
  }

  /**
   * Probe media file to get metadata
   */
  static async probeMedia(filePath: string): Promise<{
    duration: number;
    width?: number;
    height?: number;
    fps?: number;
    sampleRate?: number;
    channels?: number;
    codec?: string;
  }> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration:stream=width,height,r_frame_rate,sample_rate,channels,codec_name",
        "-of",
        "json",
        filePath,
      ]);

      let output = "";
      let errorOutput = "";

      ffprobe.stdout?.on("data", (data) => {
        output += data.toString();
      });

      ffprobe.stderr?.on("data", (data) => {
        errorOutput += data.toString();
      });

      ffprobe.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`FFprobe failed: ${errorOutput}`));
          return;
        }

        try {
          const data = JSON.parse(output);
          const format = data.format || {};
          const videoStream = data.streams?.find(
            (s: any) => s.codec_type === "video"
          );
          const audioStream = data.streams?.find(
            (s: any) => s.codec_type === "audio"
          );

          resolve({
            duration: parseFloat(format.duration || "0"),
            width: videoStream?.width,
            height: videoStream?.height,
            fps: videoStream?.r_frame_rate
              ? eval(videoStream.r_frame_rate)
              : undefined,
            sampleRate: audioStream?.sample_rate
              ? parseInt(audioStream.sample_rate)
              : undefined,
            channels: audioStream?.channels,
            codec: videoStream?.codec_name || audioStream?.codec_name,
          });
        } catch (error) {
          reject(new Error(`Failed to parse FFprobe output: ${error}`));
        }
      });
    });
  }

  /**
   * Build FFmpeg command arguments from options
   */
  private buildFFmpegArgs(options: FFmpegOptions): string[] {
    const args: string[] = [];

    // Input files
    for (const input of options.inputFiles) {
      args.push("-i", input);
    }

    // Hardware acceleration
    if (options.hardwareAccel) {
      args.push("-hwaccel", "auto");
    }

    // Video codec and settings
    if (options.copyCodec) {
      args.push("-c:v", "copy");
      args.push("-c:a", "copy");
    } else {
      if (options.videoCodec) {
        args.push("-c:v", options.videoCodec);
      }
      if (options.audioCodec) {
        args.push("-c:a", options.audioCodec);
      }

      // Video encoding options
      if (options.videoCodec === "libx264" || options.videoCodec === "h264_nvenc") {
        if (options.crf !== undefined) {
          args.push("-crf", options.crf.toString());
        }
        if (options.preset) {
          args.push("-preset", options.preset);
        }
        if (options.bitrate) {
          args.push("-b:v", options.bitrate);
        }
        if (options.videoCodec === "h264_nvenc") {
          args.push("-rc", "vbr");
          args.push("-cq", (options.crf || 19).toString());
        }
      }

      // Scale/resize
      if (options.width && options.height) {
        args.push("-vf", `scale=${options.width}:${options.height}`);
      } else if (options.fps) {
        args.push("-r", options.fps.toString());
      }
    }

    // Build filter complex
    const filters: string[] = [];

    // Audio filters
    if (options.audioGain !== undefined || options.audioFadeIn || options.audioFadeOut || options.audioLoudnorm) {
      let audioFilter = "[1:a]";
      if (options.audioGain !== undefined) {
        audioFilter += `volume=${Math.pow(10, options.audioGain / 20)}`;
      }
      if (options.audioFadeIn) {
        audioFilter += `,afade=t=in:st=0:d=${options.audioFadeIn}`;
      }
      if (options.audioFadeOut) {
        audioFilter += `,afade=t=out:st=${options.audioFadeOut}:d=${options.audioFadeOut}`;
      }
      if (options.audioLoudnorm) {
        audioFilter += ",loudnorm=I=-16:TP=-1.5:LRA=11";
      }
      audioFilter += "[a]";
      filters.push(audioFilter);
    }

    // Video overlay (logo)
    if (options.overlayImage) {
      const x = options.overlayX ?? "main_w-overlay_w-40";
      const y = options.overlayY ?? 40;
      filters.push(`[0:v][1:v]overlay=${x}:${y}[v]`);
    }

    // Subtitle
    if (options.subtitleFile) {
      const font = options.subtitleFont || "Noto Sans Thai";
      const size = options.subtitleSize || 36;
      const y = options.subtitleY || 0.9;
      filters.push(
        `subtitles=${options.subtitleFile}:force_style='FontName=${font},FontSize=${size},OutlineColour=&H40000000,BorderStyle=3,Outline=2,Shadow=0'`
      );
    }

    if (filters.length > 0) {
      args.push("-filter_complex", filters.join(";"));
    }

    // Map outputs
    if (filters.some((f) => f.includes("[v]"))) {
      args.push("-map", "[v]");
    } else {
      args.push("-map", "0:v");
    }

    if (filters.some((f) => f.includes("[a]"))) {
      args.push("-map", "[a]");
    } else if (options.inputFiles.length > 1) {
      args.push("-map", "1:a");
    } else {
      args.push("-map", "0:a?");
    }

    // Output settings
    args.push("-pix_fmt", "yuv420p");
    args.push("-vsync", "2"); // AV sync

    // Output file
    args.push("-y"); // Overwrite output file
    args.push(options.outputFile);

    return args;
  }

  /**
   * Start FFmpeg process
   */
  async start(options: FFmpegOptions): Promise<void> {
    if (this.isRunning) {
      throw new Error("FFmpeg process is already running");
    }

    const args = this.buildFFmpegArgs(options);
    this.process = spawn("ffmpeg", args);
    this.isRunning = true;

    let stderrOutput = "";

    this.process.stderr?.on("data", (data) => {
      const text = data.toString();
      stderrOutput += text;

      // Parse progress from stderr
      const progress = this.parseProgress(text);
      if (progress) {
        this.emit("progress", progress);
      }
    });

    this.process.on("close", (code) => {
      this.isRunning = false;
      if (code === 0) {
        this.emit("complete");
      } else {
        this.emit("error", new Error(`FFmpeg exited with code ${code}: ${stderrOutput}`));
      }
    });

    this.process.on("error", (error) => {
      this.isRunning = false;
      this.emit("error", error);
    });
  }

  /**
   * Parse progress from FFmpeg stderr output
   */
  private parseProgress(text: string): FFmpegProgress | null {
    // FFmpeg progress format: frame=  123 fps= 30 q=28.0 size=    1024kB time=00:00:04.12 bitrate=2000.0kbits/s speed=1.0x
    const frameMatch = text.match(/frame=\s*(\d+)/);
    const fpsMatch = text.match(/fps=\s*([\d.]+)/);
    const bitrateMatch = text.match(/bitrate=\s*([\d.]+kbits\/s)/);
    const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    const speedMatch = text.match(/speed=\s*([\d.]+)x/);

    if (!timeMatch) return null;

    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = parseInt(timeMatch[3]);
    const centiseconds = parseInt(timeMatch[4]);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds + centiseconds / 100;

    return {
      frame: frameMatch ? parseInt(frameMatch[1]) : undefined,
      fps: fpsMatch ? parseFloat(fpsMatch[1]) : undefined,
      bitrate: bitrateMatch ? bitrateMatch[1] : undefined,
      outTime: timeMatch[0].replace("time=", ""),
      outTimeMs: totalSeconds * 1000,
      speed: speedMatch ? speedMatch[1] : undefined,
    };
  }

  /**
   * Cancel the FFmpeg process
   */
  cancel(): void {
    if (this.process && this.isRunning) {
      this.process.kill("SIGTERM");
      this.isRunning = false;
      this.emit("cancelled");
    }
  }

  /**
   * Check if process is running
   */
  get running(): boolean {
    return this.isRunning;
  }
}
