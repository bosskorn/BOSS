// Project schema types for OneCut Studio

export interface MediaItem {
  id: string;
  path: string;
  type: 'video' | 'audio' | 'image' | 'subtitle';
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
  codec?: string;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  opacity: number;
}

export interface VideoClip {
  clipId: string;
  mediaId: string;
  in: number;
  out: number;
  start: number;
  transform?: Transform;
  blend?: string;
  opacity?: number;
}

export interface AudioClip {
  clipId: string;
  mediaId: string;
  in: number;
  out: number;
  start: number;
  gainDb?: number;
  fadeIn?: number;
  fadeOut?: number;
  mute?: boolean;
  solo?: boolean;
}

export interface Subtitle {
  path: string;
  font?: string;
  size?: number;
  color?: string;
  y?: number;
  outline?: number;
}

export interface Sequence {
  fps: number;
  width: number;
  height: number;
  tracks: {
    video: VideoClip[];
    audio: AudioClip[];
  };
  subtitles?: Subtitle[];
}

export interface Project {
  version: string;
  name: string;
  media: MediaItem[];
  sequence: Sequence;
  lastModified?: string;
  projectPath?: string;
}

export interface ExportPreset {
  name: string;
  codec: 'copy' | 'h264' | 'h264_nvenc' | 'hevc' | 'prores';
  audioCodec: 'copy' | 'aac' | 'mp3' | 'pcm';
  videoBitrate?: string;
  audioBitrate?: string;
  crf?: number;
  preset?: string;
  resolution?: { width: number; height: number };
  fps?: number;
  hwAccel?: boolean;
}

export interface ExportSettings {
  preset: ExportPreset;
  outputPath: string;
  fileName: string;
}

export interface JobProgress {
  jobId: string;
  status: 'queued' | 'probing' | 'rendering' | 'muxing' | 'done' | 'failed';
  progress: number;
  currentTime?: number;
  totalTime?: number;
  speed?: string;
  eta?: number;
  error?: string;
}
