// Inspector component - shows properties of selected clip
import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

export function Inspector() {
  const {
    project,
    selectedClipId,
    updateVideoClip,
    updateAudioClip,
    removeClip,
  } = useProjectStore();

  if (!selectedClipId) {
    return (
      <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
        <div className="p-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Inspector</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
          <p>No clip selected</p>
        </div>
      </div>
    );
  }

  const videoClip = project?.sequence.tracks.video.find((c) => c.clipId === selectedClipId);
  const audioClip = project?.sequence.tracks.audio.find((c) => c.clipId === selectedClipId);
  const clip = videoClip || audioClip;

  if (!clip) {
    return (
      <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
        <div className="p-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Inspector</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
          <p>Clip not found</p>
        </div>
      </div>
    );
  }

  const media = project?.media.find((m) => m.id === clip.mediaId);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-100">Inspector</h2>
        <p className="text-xs text-zinc-500 mt-1 truncate">
          {media?.path.split('/').pop()}
        </p>
      </div>

      {/* Properties */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Basic info */}
          <div>
            <Label className="text-xs text-zinc-400">Clip ID</Label>
            <p className="text-sm text-zinc-300 font-mono mt-1">{clip.clipId}</p>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Timing */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300">Timing</h3>
            
            <div>
              <Label className="text-xs text-zinc-400">Start</Label>
              <Input
                type="number"
                step="0.1"
                value={clip.start.toFixed(2)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (videoClip) {
                    updateVideoClip(selectedClipId, { start: value });
                  } else if (audioClip) {
                    updateAudioClip(selectedClipId, { start: value });
                  }
                }}
                className="h-8 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400">In Point</Label>
              <Input
                type="number"
                step="0.1"
                value={clip.in.toFixed(2)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (videoClip) {
                    updateVideoClip(selectedClipId, { in: value });
                  } else if (audioClip) {
                    updateAudioClip(selectedClipId, { in: value });
                  }
                }}
                className="h-8 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400">Out Point</Label>
              <Input
                type="number"
                step="0.1"
                value={clip.out.toFixed(2)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (videoClip) {
                    updateVideoClip(selectedClipId, { out: value });
                  } else if (audioClip) {
                    updateAudioClip(selectedClipId, { out: value });
                  }
                }}
                className="h-8 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400">Duration</Label>
              <p className="text-sm text-zinc-300 mt-1">
                {(clip.out - clip.in).toFixed(2)}s
              </p>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Video properties */}
          {videoClip && (
            <>
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-300">Transform</h3>
                
                <div>
                  <Label className="text-xs text-zinc-400">Opacity</Label>
                  <Slider
                    value={[videoClip.transform?.opacity || 1]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([value]) => {
                      updateVideoClip(selectedClipId, {
                        transform: { ...videoClip.transform, opacity: value, x: 0, y: 0, scale: 1 },
                      });
                    }}
                    className="mt-2"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    {((videoClip.transform?.opacity || 1) * 100).toFixed(0)}%
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-zinc-400">Scale</Label>
                  <Slider
                    value={[videoClip.transform?.scale || 1]}
                    min={0.1}
                    max={3}
                    step={0.01}
                    onValueChange={([value]) => {
                      updateVideoClip(selectedClipId, {
                        transform: { ...videoClip.transform, scale: value, x: 0, y: 0, opacity: 1 },
                      });
                    }}
                    className="mt-2"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    {((videoClip.transform?.scale || 1) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <Separator className="bg-zinc-800" />
            </>
          )}

          {/* Audio properties */}
          {audioClip && (
            <>
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-300">Audio</h3>
                
                <div>
                  <Label className="text-xs text-zinc-400">Gain (dB)</Label>
                  <Slider
                    value={[audioClip.gainDb || 0]}
                    min={-30}
                    max={12}
                    step={0.5}
                    onValueChange={([value]) => {
                      updateAudioClip(selectedClipId, { gainDb: value });
                    }}
                    className="mt-2"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    {(audioClip.gainDb || 0).toFixed(1)} dB
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-zinc-400">Fade In (s)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={audioClip.fadeIn || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      updateAudioClip(selectedClipId, { fadeIn: value });
                    }}
                    className="h-8 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-zinc-400">Fade Out (s)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={audioClip.fadeOut || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      updateAudioClip(selectedClipId, { fadeOut: value });
                    }}
                    className="h-8 mt-1"
                  />
                </div>
              </div>

              <Separator className="bg-zinc-800" />
            </>
          )}

          {/* Actions */}
          <div>
            <button
              onClick={() => removeClip(selectedClipId)}
              className="w-full py-2 px-3 text-sm bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
            >
              Remove Clip
            </button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
