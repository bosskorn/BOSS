import { useState, useEffect } from "react";
import { Project, MediaItem } from "@core/index";
import MediaBin from "./components/MediaBin";
import Timeline from "./components/Timeline";
import Viewer from "./components/Viewer";
import Inspector from "./components/Inspector";
import ExportPanel from "./components/ExportPanel";
import { useProjectStore } from "./store/projectStore";

function App() {
  const { project, setProject, loadProject, createNewProject } = useProjectStore();
  const [showExportPanel, setShowExportPanel] = useState(false);

  useEffect(() => {
    // Create new project on startup
    if (!project) {
      createNewProject();
    }
  }, []);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">OneCut Studio</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="h-12 border-b border-border flex items-center px-4 bg-card">
        <h1 className="text-lg font-semibold">OneCut Studio</h1>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => window.electronAPI.openProject()}
            className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded"
          >
            Open Project
          </button>
          <button
            onClick={() => window.electronAPI.saveProject(project)}
            className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded"
          >
            Save Project
          </button>
          <button
            onClick={() => setShowExportPanel(true)}
            className="px-3 py-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded"
          >
            Export
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Media Bin (Left) */}
        <div className="w-64 border-r border-border bg-card">
          <MediaBin />
        </div>

        {/* Center Area */}
        <div className="flex-1 flex flex-col">
          {/* Viewer (Top) */}
          <div className="h-64 border-b border-border bg-black">
            <Viewer />
          </div>

          {/* Timeline (Bottom) */}
          <div className="flex-1 overflow-auto">
            <Timeline />
          </div>
        </div>

        {/* Inspector (Right) */}
        <div className="w-80 border-l border-border bg-card">
          <Inspector />
        </div>
      </div>

      {/* Export Panel Modal */}
      {showExportPanel && (
        <ExportPanel
          project={project}
          onClose={() => setShowExportPanel(false)}
        />
      )}
    </div>
  );
}

export default App;
