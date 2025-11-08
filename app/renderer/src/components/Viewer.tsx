import { useProjectStore } from "../store/projectStore";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useState } from "react";

export default function Viewer() {
  const { project } = useProjectStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Calculate total duration from sequence
  const totalDuration = project?.sequence.tracks.video.reduce((max, clip) => {
    return Math.max(max, clip.start + (clip.out - clip.in));
  }, 0) || 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Video Preview Area */}
      <div className="flex-1 flex items-center justify-center bg-black/50 relative">
        <div className="text-white/50 text-sm">
          {project?.sequence.tracks.video.length === 0
            ? "No video clips on timeline"
            : "Video Preview"}
        </div>
      </div>

      {/* Controls */}
      <div className="h-16 bg-card border-t border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 flex items-center justify-center rounded hover:bg-accent"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent">
            <SkipBack className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span>{formatTime(currentTime)}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}
