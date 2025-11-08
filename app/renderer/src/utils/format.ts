// Utility functions for the renderer

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return "--:--";
  return formatTime(seconds);
}

export function getFileExtension(path: string): string {
  return path.split(".").pop()?.toLowerCase() || "";
}

export function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}
