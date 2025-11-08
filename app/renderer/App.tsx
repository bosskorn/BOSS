// Main App component for OneCut Studio
import React, { useEffect } from 'react';
import { useProjectStore } from './store/projectStore';
import { MediaBin } from './components/MediaBin/MediaBin';
import { Timeline } from './components/Timeline/Timeline';
import { Viewer } from './components/Viewer/Viewer';
import { Inspector } from './components/Inspector/Inspector';
import { ExportPanel } from './components/Export/ExportPanel';
import { Button } from '@/components/ui/button';
import { 
  MenubarMenu, 
  MenubarItem, 
  MenubarTrigger, 
  MenubarContent, 
  Menubar 
} from '@/components/ui/menubar';
import { FileText, FolderOpen, Save, Film } from 'lucide-react';

export function App() {
  const { project, setProject } = useProjectStore();

  useEffect(() => {
    // Initialize with a new project
    if (!project) {
      handleNewProject();
    }
  }, []);

  const handleNewProject = async () => {
    const newProject = await window.electron.newProject();
    setProject(newProject);
  };

  const handleOpenProject = async () => {
    try {
      const filePath = await window.electron.openProjectDialog();
      if (filePath) {
        const loadedProject = await window.electron.loadProject(filePath);
        setProject(loadedProject);
      }
    } catch (error) {
      console.error('Failed to open project:', error);
      alert('Failed to open project');
    }
  };

  const handleSaveProject = async () => {
    if (!project) return;

    try {
      const filePath = project.projectPath || await window.electron.saveProjectDialog(project.name + '.onecut.json');
      if (filePath) {
        await window.electron.saveProject(project, filePath);
        setProject({ ...project, projectPath: filePath });
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project');
    }
  };

  const handleSaveProjectAs = async () => {
    if (!project) return;

    try {
      const filePath = await window.electron.saveProjectDialog(project.name + '.onecut.json');
      if (filePath) {
        await window.electron.saveProject(project, filePath);
        setProject({ ...project, projectPath: filePath });
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project');
    }
  };

  // Auto-save every 2 minutes
  useEffect(() => {
    if (!project) return;

    const interval = setInterval(() => {
      window.electron.autoSaveProject(project);
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [project]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      {/* Menu Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-blue-500" />
            <h1 className="text-lg font-bold">OneCut Studio</h1>
          </div>

          <Menubar className="border-none bg-transparent">
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={handleNewProject}>
                  <FileText className="w-4 h-4 mr-2" />
                  New Project
                </MenubarItem>
                <MenubarItem onClick={handleOpenProject}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Open Project
                </MenubarItem>
                <MenubarItem onClick={handleSaveProject} disabled={!project}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Project
                </MenubarItem>
                <MenubarItem onClick={handleSaveProjectAs} disabled={!project}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Project As...
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>

        <div className="flex items-center gap-2">
          {project?.projectPath && (
            <span className="text-xs text-zinc-500 mr-4">
              {project.projectPath.split('/').pop()}
            </span>
          )}
          <ExportPanel />
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Media Bin */}
        <div className="w-64 flex-shrink-0">
          <MediaBin />
        </div>

        {/* Center Panel - Viewer + Timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Viewer */}
          <div className="h-2/3 border-b border-zinc-800">
            <Viewer />
          </div>

          {/* Timeline */}
          <div className="h-1/3">
            <Timeline />
          </div>
        </div>

        {/* Right Panel - Inspector */}
        <div className="w-80 flex-shrink-0">
          <Inspector />
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-1 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-500">
        <div className="flex items-center justify-between">
          <span>Ready</span>
          <span>
            {project?.media.length || 0} media items • 
            {project?.sequence.tracks.video.length || 0} video clips • 
            {project?.sequence.tracks.audio.length || 0} audio clips
          </span>
        </div>
      </div>
    </div>
  );
}
