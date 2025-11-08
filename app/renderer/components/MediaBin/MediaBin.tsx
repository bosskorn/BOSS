// Media Bin component - displays imported media files
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Film, Music, Image as ImageIcon, FileText, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import type { MediaItem } from '../../../../core/types/project';

export function MediaBin() {
  const { project, addMedia, removeMedia } = useProjectStore();
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const files = await window.electron.openFileDialog();
      
      for (const filePath of files) {
        const metadata = await window.electron.probeMedia(filePath);
        
        const mediaType = determineMediaType(filePath, metadata);
        const mediaItem: MediaItem = {
          id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          path: filePath,
          type: mediaType,
          duration: metadata.duration,
          fps: metadata.fps,
          width: metadata.width,
          height: metadata.height,
          codec: metadata.codec,
        };
        
        addMedia(mediaItem);
      }
    } catch (error) {
      console.error('Failed to import media:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const determineMediaType = (path: string, metadata: any): MediaItem['type'] => {
    const ext = path.split('.').pop()?.toLowerCase();
    
    if (['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(ext || '')) {
      return 'video';
    } else if (['mp3', 'wav', 'aac', 'm4a'].includes(ext || '')) {
      return 'audio';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return 'image';
    } else if (['srt', 'ass', 'vtt'].includes(ext || '')) {
      return 'subtitle';
    }
    
    return metadata.width ? 'video' : 'audio';
  };

  const getMediaIcon = (type: MediaItem['type']) => {
    switch (type) {
      case 'video': return <Film className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'subtitle': return <FileText className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-100">Media Bin</h2>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={isImporting}
            className="h-8"
          >
            <Plus className="w-4 h-4 mr-1" />
            Import
          </Button>
        </div>
        <div className="text-xs text-zinc-500">
          {project?.media.length || 0} items
        </div>
      </div>

      {/* Media list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {project?.media.map((media) => (
            <div
              key={media.id}
              className="group flex items-center gap-2 p-2 rounded hover:bg-zinc-800 cursor-pointer transition-colors"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('mediaId', media.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <div className="flex-shrink-0 text-zinc-400">
                {getMediaIcon(media.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-zinc-200 truncate">
                  {media.path.split('/').pop()}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>{media.type}</span>
                  {media.duration && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(media.duration)}</span>
                    </>
                  )}
                  {media.width && media.height && (
                    <>
                      <span>•</span>
                      <span>{media.width}x{media.height}</span>
                    </>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeMedia(media.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}

          {(!project?.media.length) && (
            <div className="text-center py-8 text-zinc-500 text-sm">
              <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No media imported</p>
              <p className="text-xs mt-1">Click Import to add files</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
