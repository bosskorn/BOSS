import { z } from "zod";

// Media item schema
export const MediaItemSchema = z.object({
  id: z.string(),
  path: z.string(),
  type: z.enum(["video", "audio", "subtitle", "image"]),
  name: z.string().optional(),
  duration: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  fps: z.number().optional(),
  sampleRate: z.number().optional(),
  channels: z.number().optional(),
});

export type MediaItem = z.infer<typeof MediaItemSchema>;

// Transform schema for video clips
export const TransformSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  scale: z.number().default(1),
  opacity: z.number().default(1),
  rotation: z.number().default(0),
});

export type Transform = z.infer<typeof TransformSchema>;

// Video clip schema
export const VideoClipSchema = z.object({
  clipId: z.string(),
  mediaId: z.string(),
  in: z.number(), // In point in seconds
  out: z.number(), // Out point in seconds
  start: z.number(), // Start time on timeline
  transform: TransformSchema.default({}),
  blend: z.enum(["normal", "multiply", "screen", "overlay"]).default("normal"),
});

export type VideoClip = z.infer<typeof VideoClipSchema>;

// Audio clip schema
export const AudioClipSchema = z.object({
  clipId: z.string(),
  mediaId: z.string(),
  in: z.number(),
  out: z.number(),
  start: z.number(),
  gainDb: z.number().default(0), // Gain in decibels
  fadeIn: z.number().default(0), // Fade in duration in seconds
  fadeOut: z.number().default(0), // Fade out duration in seconds
  mute: z.boolean().default(false),
  solo: z.boolean().default(false),
});

export type AudioClip = z.infer<typeof AudioClipSchema>;

// Subtitle configuration
export const SubtitleConfigSchema = z.object({
  path: z.string(),
  font: z.string().default("Noto Sans Thai"),
  size: z.number().default(36),
  y: z.number().default(0.9), // Position (0-1, 0.9 = near bottom)
  encoding: z.string().default("UTF-8"),
});

export type SubtitleConfig = z.infer<typeof SubtitleConfigSchema>;

// Sequence schema
export const SequenceSchema = z.object({
  fps: z.number().default(30),
  width: z.number().default(1920),
  height: z.number().default(1080),
  tracks: z.object({
    video: z.array(VideoClipSchema).default([]),
    audio: z.array(AudioClipSchema).default([]),
  }),
  subtitles: z.array(SubtitleConfigSchema).default([]),
});

export type Sequence = z.infer<typeof SequenceSchema>;

// Project schema
export const ProjectSchema = z.object({
  version: z.string().default("1.0.0"),
  name: z.string().optional(),
  media: z.array(MediaItemSchema).default([]),
  sequence: SequenceSchema,
});

export type Project = z.infer<typeof ProjectSchema>;

// Export preset schema
export const ExportPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  videoCodec: z.string(),
  audioCodec: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  fps: z.number().optional(),
  bitrate: z.string().optional(), // e.g., "6M"
  crf: z.number().optional(), // Quality (18-28)
  preset: z.string().optional(), // e.g., "medium", "fast"
  hardwareAccel: z.boolean().default(false),
  copyCodec: z.boolean().default(false), // Fast merge mode
});

export type ExportPreset = z.infer<typeof ExportPresetSchema>;

// Default export presets
export const DEFAULT_EXPORT_PRESETS: ExportPreset[] = [
  {
    id: "fast-merge",
    name: "Fast Merge (Copy Codec)",
    description: "รวมเร็วไม่แปลง - คัดลอก codec โดยตรง",
    videoCodec: "copy",
    audioCodec: "copy",
    copyCodec: true,
  },
  {
    id: "youtube-1080p",
    name: "YouTube 1080p H.264 + AAC",
    description: "H.264, CRF 18-20, AAC 192k, yuv420p",
    videoCodec: "libx264",
    audioCodec: "aac",
    width: 1920,
    height: 1080,
    crf: 19,
    preset: "medium",
    bitrate: "6M",
    hardwareAccel: true,
  },
  {
    id: "social-720p",
    name: "Social 720p",
    description: "H.264, CRF 21, 30fps, AAC 128k",
    videoCodec: "libx264",
    audioCodec: "aac",
    width: 1280,
    height: 720,
    fps: 30,
    crf: 21,
    preset: "medium",
    bitrate: "3M",
  },
  {
    id: "archival",
    name: "Archival (HEVC)",
    description: "HEVC (H.265) CRF 20, AAC 192k",
    videoCodec: "libx265",
    audioCodec: "aac",
    crf: 20,
    preset: "medium",
    bitrate: "4M",
  },
];
