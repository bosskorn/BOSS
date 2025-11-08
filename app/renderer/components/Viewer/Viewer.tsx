// Viewer component - preview video output
import React, { useRef, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Viewer() {
  const { project, currentTime, isPlaying, setPlaying, setCurrentTime } = useProjectStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // For MVP, we'll show a simple preview
  // In production, this would render the composite output
  useEffect(() => {
    if (!canvasRef.current || !project) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = project.sequence.width;
    canvas.height = project.sequence.height;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw placeholder
    ctx.fillStyle = '#333';
    ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);
    
    ctx.fillStyle = '#666';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Preview', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '16px monospace';
    ctx.fillStyle = '#999';
    const timeStr = formatTime(currentTime);
    ctx.fillText(timeStr, canvas.width / 2, canvas.height / 2 + 40);
  }, [project, currentTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * (project?.sequence.fps || 30));
    return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Viewer header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-100">Viewer</h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full"
            style={{
              aspectRatio: project
                ? `${project.sequence.width} / ${project.sequence.height}`
                : '16 / 9',
              width: '100%',
              height: 'auto',
            }}
          />
          
          {!project && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <p className="text-sm">No project loaded</p>
                <p className="text-xs mt-1">Create a new project to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info bar */}
      <div className="p-2 border-t border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            {project?.sequence.width || 1920} × {project?.sequence.height || 1080}
          </span>
          <span>{project?.sequence.fps || 30} fps</span>
          <span>{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  );
}
