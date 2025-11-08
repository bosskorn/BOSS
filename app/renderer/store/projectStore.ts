// Project store using React Context
import { create } from 'zustand';
import type { Project, MediaItem, VideoClip, AudioClip, ExportSettings } from '../../../core/types/project';

interface ProjectStore {
  project: Project | null;
  selectedClipId: string | null;
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  
  // Actions
  setProject: (project: Project) => void;
  updateProject: (updates: Partial<Project>) => void;
  addMedia: (media: MediaItem) => void;
  removeMedia: (mediaId: string) => void;
  addVideoClip: (clip: VideoClip) => void;
  addAudioClip: (clip: AudioClip) => void;
  updateVideoClip: (clipId: string, updates: Partial<VideoClip>) => void;
  updateAudioClip: (clipId: string, updates: Partial<AudioClip>) => void;
  removeClip: (clipId: string) => void;
  setSelectedClip: (clipId: string | null) => void;
  setCurrentTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: null,
  selectedClipId: null,
  currentTime: 0,
  isPlaying: false,
  zoom: 1,

  setProject: (project) => set({ project }),

  updateProject: (updates) =>
    set((state) => ({
      project: state.project ? { ...state.project, ...updates } : null,
    })),

  addMedia: (media) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            media: [...state.project.media, media],
          }
        : null,
    })),

  removeMedia: (mediaId) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            media: state.project.media.filter((m) => m.id !== mediaId),
            sequence: {
              ...state.project.sequence,
              tracks: {
                video: state.project.sequence.tracks.video.filter(
                  (c) => c.mediaId !== mediaId
                ),
                audio: state.project.sequence.tracks.audio.filter(
                  (c) => c.mediaId !== mediaId
                ),
              },
            },
          }
        : null,
    })),

  addVideoClip: (clip) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            sequence: {
              ...state.project.sequence,
              tracks: {
                ...state.project.sequence.tracks,
                video: [...state.project.sequence.tracks.video, clip],
              },
            },
          }
        : null,
    })),

  addAudioClip: (clip) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            sequence: {
              ...state.project.sequence,
              tracks: {
                ...state.project.sequence.tracks,
                audio: [...state.project.sequence.tracks.audio, clip],
              },
            },
          }
        : null,
    })),

  updateVideoClip: (clipId, updates) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            sequence: {
              ...state.project.sequence,
              tracks: {
                ...state.project.sequence.tracks,
                video: state.project.sequence.tracks.video.map((c) =>
                  c.clipId === clipId ? { ...c, ...updates } : c
                ),
              },
            },
          }
        : null,
    })),

  updateAudioClip: (clipId, updates) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            sequence: {
              ...state.project.sequence,
              tracks: {
                ...state.project.sequence.tracks,
                audio: state.project.sequence.tracks.audio.map((c) =>
                  c.clipId === clipId ? { ...c, ...updates } : c
                ),
              },
            },
          }
        : null,
    })),

  removeClip: (clipId) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            sequence: {
              ...state.project.sequence,
              tracks: {
                video: state.project.sequence.tracks.video.filter(
                  (c) => c.clipId !== clipId
                ),
                audio: state.project.sequence.tracks.audio.filter(
                  (c) => c.clipId !== clipId
                ),
              },
            },
          }
        : null,
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    })),

  setSelectedClip: (clipId) => set({ selectedClipId: clipId }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setZoom: (zoom) => set({ zoom }),
}));
