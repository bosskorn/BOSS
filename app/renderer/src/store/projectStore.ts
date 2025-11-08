import { create } from "zustand";
import { Project, createNewProject as createNewProjectCore } from "@core/index";

interface ProjectStore {
  project: Project | null;
  projectPath: string | null;
  setProject: (project: Project, path?: string) => void;
  loadProject: (filePath?: string) => Promise<void>;
  createNewProject: () => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: null,
  projectPath: null,
  setProject: (project, path) => set({ project, projectPath: path || null }),
  loadProject: async (filePath) => {
    try {
      const result = await window.electronAPI.openProject(filePath);
      if (result) {
        set({ project: result.project, projectPath: result.filePath });
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  },
  createNewProject: async () => {
    const project = await window.electronAPI.createNewProject();
    set({ project, projectPath: null });
  },
}));
