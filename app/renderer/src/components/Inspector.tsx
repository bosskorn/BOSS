import { useProjectStore } from "../store/projectStore";
import { useState } from "react";

export default function Inspector() {
  const { project } = useProjectStore();
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  if (!project) return null;

  const selectedVideoClip = project.sequence.tracks.video.find(
    (clip) => clip.clipId === selectedClipId
  );
  const selectedAudioClip = project.sequence.tracks.audio.find(
    (clip) => clip.clipId === selectedClipId
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold">Inspector</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!selectedVideoClip && !selectedAudioClip ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            Select a clip to edit properties
          </div>
        ) : (
          <div className="space-y-4">
            {selectedVideoClip && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Video Clip Properties</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Position X</label>
                    <input
                      type="number"
                      value={selectedVideoClip.transform.x}
                      className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Position Y</label>
                    <input
                      type="number"
                      value={selectedVideoClip.transform.y}
                      className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Scale</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedVideoClip.transform.scale}
                      className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Opacity</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={selectedVideoClip.transform.opacity}
                      className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedAudioClip && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Audio Clip Properties</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Gain (dB)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedAudioClip.gainDb}
                      className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Fade In (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedAudioClip.fadeIn}
                      className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Fade Out (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedAudioClip.fadeOut}
                      className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
