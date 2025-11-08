import { useProjectStore } from "../store/projectStore";
import { VideoClip, AudioClip } from "@core/index";
import { useState } from "react";

export default function Timeline() {
  const { project, setProject } = useProjectStore();
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);

  if (!project) return null;

  const { sequence } = project;
  const videoTracks = sequence.tracks.video;
  const audioTracks = sequence.tracks.audio;

  // Calculate timeline duration
  const maxDuration = Math.max(
    ...videoTracks.map((clip) => clip.start + (clip.out - clip.in)),
    ...audioTracks.map((clip) => clip.start + (clip.out - clip.in)),
    10 // Minimum 10 seconds
  );

  const pixelsPerSecond = 50 * zoom;
  const timelineWidth = maxDuration * pixelsPerSecond;

  const getMediaName = (mediaId: string) => {
    const media = project.media.find((m) => m.id === mediaId);
    return media?.name || media?.path.split(/[/\\]/).pop() || "Unknown";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Timeline Header */}
      <div className="h-8 border-b border-border flex items-center px-4 bg-muted/50">
        <div className="flex-1 flex items-center gap-4">
          <span className="text-xs font-medium">Timeline</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="px-2 py-1 text-xs rounded hover:bg-accent"
            >
              -
            </button>
            <span className="text-xs w-16 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(4, zoom + 0.25))}
              className="px-2 py-1 text-xs rounded hover:bg-accent"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Ruler */}
      <div className="h-6 border-b border-border bg-muted/30 overflow-hidden">
        <div
          className="h-full relative"
          style={{
            width: `${timelineWidth}px`,
            transform: `translateX(-${scrollLeft}px)`,
          }}
        >
          {Array.from({ length: Math.ceil(maxDuration) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-border"
              style={{ left: `${i * pixelsPerSecond}px` }}
            >
              <span className="absolute top-0 left-1 text-xs text-muted-foreground">
                {formatTime(i)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Video Tracks */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full">
          {/* Video Track */}
          <div className="h-24 border-b border-border">
            <div className="h-full flex items-center px-2">
              <div className="w-24 text-xs font-medium">Video</div>
              <div className="flex-1 h-full relative overflow-hidden">
                <div
                  className="absolute top-0 bottom-0"
                  style={{
                    width: `${timelineWidth}px`,
                    transform: `translateX(-${scrollLeft}px)`,
                  }}
                >
                  {videoTracks.map((clip) => {
                    const clipWidth = (clip.out - clip.in) * pixelsPerSecond;
                    const clipLeft = clip.start * pixelsPerSecond;
                    return (
                      <div
                        key={clip.clipId}
                        className="absolute top-2 bottom-2 bg-primary/80 rounded border border-primary-foreground/20 cursor-move"
                        style={{
                          left: `${clipLeft}px`,
                          width: `${clipWidth}px`,
                        }}
                      >
                        <div className="h-full flex items-center px-2 text-xs text-primary-foreground truncate">
                          {getMediaName(clip.mediaId)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Audio Track */}
          <div className="h-24 border-b border-border">
            <div className="h-full flex items-center px-2">
              <div className="w-24 text-xs font-medium">Audio</div>
              <div className="flex-1 h-full relative overflow-hidden">
                <div
                  className="absolute top-0 bottom-0"
                  style={{
                    width: `${timelineWidth}px`,
                    transform: `translateX(-${scrollLeft}px)`,
                  }}
                >
                  {audioTracks.map((clip) => {
                    const clipWidth = (clip.out - clip.in) * pixelsPerSecond;
                    const clipLeft = clip.start * pixelsPerSecond;
                    return (
                      <div
                        key={clip.clipId}
                        className="absolute top-2 bottom-2 bg-secondary rounded border border-border cursor-move"
                        style={{
                          left: `${clipLeft}px`,
                          width: `${clipWidth}px`,
                        }}
                      >
                        <div className="h-full flex items-center px-2 text-xs truncate">
                          {getMediaName(clip.mediaId)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
