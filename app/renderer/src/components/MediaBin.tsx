import { useState, useEffect } from "react";
import { useProjectStore } from "../store/projectStore";
import { MediaItem } from "@core/index";
import { Plus, Video, Music, FileText } from "lucide-react";

export default function MediaBin() {
  const { project, setProject } = useProjectStore();
  const [media, setMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (project) {
      setMedia(project.media);
    }
  }, [project]);

  const handleImport = async () => {
    const files = await window.electronAPI.openFileDialog();
    if (!files || !project) return;

    const newMedia: MediaItem[] = [];

    for (const filePath of files) {
      try {
        const metadata = await window.electronAPI.probeMedia(filePath);
        const ext = filePath.split(".").pop()?.toLowerCase() || "";
        const type =
          ["mp4", "mov", "mkv", "webm"].includes(ext)
            ? "video"
            : ["mp3", "wav", "aac"].includes(ext)
            ? "audio"
            : ["srt", "ass"].includes(ext)
            ? "subtitle"
            : "image";

        newMedia.push({
          id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          path: filePath,
          type: type as any,
          name: filePath.split(/[/\\]/).pop(),
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          fps: metadata.fps,
          sampleRate: metadata.sampleRate,
          channels: metadata.channels,
        });
      } catch (error) {
        console.error(`Failed to probe ${filePath}:`, error);
      }
    }

    if (newMedia.length > 0 && project) {
      setProject({
        ...project,
        media: [...project.media, ...newMedia],
      });
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "audio":
        return <Music className="w-4 h-4" />;
      case "subtitle":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold mb-2">Media Bin</h2>
        <button
          onClick={handleImport}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Import Media
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {media.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No media imported
          </div>
        ) : (
          <div className="space-y-2">
            {media.map((item) => (
              <div
                key={item.id}
                className="p-2 border border-border rounded hover:bg-accent cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">{getIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.name || item.path.split(/[/\\]/).pop()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.type === "video" && item.width && item.height
                        ? `${item.width}x${item.height}`
                        : ""}
                      {item.duration ? ` • ${formatDuration(item.duration)}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
