// Timeline component - main editing interface
import React, { useRef, useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react';
import type { VideoClip, AudioClip } from '../../../../core/types/project';

export function Timeline() {
  const {
    project,
    currentTime,
    isPlaying,
    zoom,
    setCurrentTime,
    setPlaying,
    setZoom,
    addVideoClip,
    addAudioClip,
    selectedClipId,
    setSelectedClip,
  } = useProjectStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const pixelsPerSecond = 50 * zoom;
  const maxDuration = Math.max(
    ...project?.sequence.tracks.video.map((c) => c.start + (c.out - c.in)) || [0],
    ...project?.sequence.tracks.audio.map((c) => c.start + (c.out - c.in)) || [0],
    60
  );

  const handlePlayPause = () => {
    setPlaying(!isPlaying);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / pixelsPerSecond;
    setCurrentTime(Math.max(0, Math.min(time, maxDuration)));
  };

  const handleDrop = (e: React.DragEvent, trackType: 'video' | 'audio') => {
    e.preventDefault();
    const mediaId = e.dataTransfer.getData('mediaId');
    if (!mediaId || !project) return;

    const media = project.media.find((m) => m.id === mediaId);
    if (!media) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const startTime = x / pixelsPerSecond;

    const clipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (trackType === 'video' && (media.type === 'video' || media.type === 'image')) {
      const clip: VideoClip = {
        clipId,
        mediaId,
        in: 0,
        out: media.duration || 5,
        start: startTime,
        transform: { x: 0, y: 0, scale: 1, opacity: 1 },
      };
      addVideoClip(clip);
    } else if (trackType === 'audio' && (media.type === 'audio' || media.type === 'video')) {
      const clip: AudioClip = {
        clipId,
        mediaId,
        in: 0,
        out: media.duration || 5,
        start: startTime,
        gainDb: 0,
      };
      addAudioClip(clip);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * (project?.sequence.fps || 30));
    return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-t border-zinc-800">
      {/* Transport controls */}
      <div className="flex items-center justify-between p-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setCurrentTime(0)}>
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCurrentTime(maxDuration)}>
            <SkipForward className="w-4 h-4" />
          </Button>
          <div className="ml-4 text-sm font-mono text-zinc-400">
            {formatTime(currentTime)} / {formatTime(maxDuration)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-zinc-400 w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
          <Button size="sm" variant="ghost" onClick={() => setZoom(Math.min(3, zoom + 0.25))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timeline area */}
      <ScrollArea className="flex-1">
        <div className="relative p-4">
          {/* Time ruler */}
          <div className="relative h-8 mb-2 border-b border-zinc-700">
            <div className="absolute inset-0 flex">
              {Array.from({ length: Math.ceil(maxDuration) }).map((_, i) => (
                <div
                  key={i}
                  className="relative border-l border-zinc-700"
                  style={{ width: `${pixelsPerSecond}px` }}
                >
                  <span className="absolute -top-1 left-1 text-xs text-zinc-500">{i}s</span>
                </div>
              ))}
            </div>
          </div>

          {/* Video track */}
          <div className="mb-2">
            <div className="text-xs text-zinc-400 mb-1 px-2">Video</div>
            <div
              ref={timelineRef}
              className="relative h-16 bg-zinc-800/50 rounded border border-zinc-700"
              style={{ width: `${maxDuration * pixelsPerSecond}px`, minWidth: '100%' }}
              onClick={handleTimelineClick}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, 'video')}
            >
              {project?.sequence.tracks.video.map((clip) => {
                const media = project.media.find((m) => m.id === clip.mediaId);
                return (
                  <div
                    key={clip.clipId}
                    className={`absolute top-1 h-14 rounded bg-blue-600 border-2 cursor-move ${
                      selectedClipId === clip.clipId ? 'border-blue-400' : 'border-blue-700'
                    }`}
                    style={{
                      left: `${clip.start * pixelsPerSecond}px`,
                      width: `${(clip.out - clip.in) * pixelsPerSecond}px`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClip(clip.clipId);
                    }}
                  >
                    <div className="p-1 text-xs text-white truncate">
                      {media?.path.split('/').pop()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audio track */}
          <div className="mb-2">
            <div className="text-xs text-zinc-400 mb-1 px-2">Audio</div>
            <div
              className="relative h-16 bg-zinc-800/50 rounded border border-zinc-700"
              style={{ width: `${maxDuration * pixelsPerSecond}px`, minWidth: '100%' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, 'audio')}
            >
              {project?.sequence.tracks.audio.map((clip) => {
                const media = project.media.find((m) => m.id === clip.mediaId);
                return (
                  <div
                    key={clip.clipId}
                    className={`absolute top-1 h-14 rounded bg-green-600 border-2 cursor-move ${
                      selectedClipId === clip.clipId ? 'border-green-400' : 'border-green-700'
                    }`}
                    style={{
                      left: `${clip.start * pixelsPerSecond}px`,
                      width: `${(clip.out - clip.in) * pixelsPerSecond}px`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClip(clip.clipId);
                    }}
                  >
                    <div className="p-1 text-xs text-white truncate">
                      {media?.path.split('/').pop()}
                    </div>
                    <div className="px-1 text-xs text-white/70">
                      {clip.gainDb ? `${clip.gainDb > 0 ? '+' : ''}${clip.gainDb}dB` : '0dB'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Playhead */}
          <div
            className="absolute top-8 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
            style={{ left: `${currentTime * pixelsPerSecond + 16}px` }}
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
