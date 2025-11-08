import { Project, ProjectSchema } from "./schema.js";
import { readFile, writeFile } from "fs/promises";
import { join, dirname, relative, resolve } from "path";
import { existsSync } from "fs";

export interface ProjectLoadOptions {
  projectPath: string;
  mediaBasePath?: string; // Base path for resolving relative media paths
}

export interface ProjectSaveOptions {
  projectPath: string;
  mediaBasePath?: string; // Base path for making media paths relative
}

/**
 * Load a project from a JSON file
 */
export async function loadProject(
  options: ProjectLoadOptions
): Promise<Project> {
  const { projectPath, mediaBasePath = dirname(projectPath) } = options;

  if (!existsSync(projectPath)) {
    throw new Error(`Project file not found: ${projectPath}`);
  }

  const content = await readFile(projectPath, "utf-8");
  const data = JSON.parse(content);

  // Validate schema
  const project = ProjectSchema.parse(data);

  // Relink media paths if needed
  if (mediaBasePath) {
    project.media = project.media.map((media) => ({
      ...media,
      path: resolve(mediaBasePath, media.path),
    }));
  }

  return project;
}

/**
 * Save a project to a JSON file
 */
export async function saveProject(
  project: Project,
  options: ProjectSaveOptions
): Promise<void> {
  const { projectPath, mediaBasePath = dirname(projectPath) } = options;

  // Make media paths relative to project directory
  const projectDir = dirname(projectPath);
  const projectToSave = {
    ...project,
    media: project.media.map((media) => ({
      ...media,
      path: relative(projectDir, media.path),
    })),
  };

  const content = JSON.stringify(projectToSave, null, 2);
  await writeFile(projectPath, content, "utf-8");
}

/**
 * Create a new empty project
 */
export function createNewProject(name?: string): Project {
  return {
    version: "1.0.0",
    name: name || "Untitled Project",
    media: [],
    sequence: {
      fps: 30,
      width: 1920,
      height: 1080,
      tracks: {
        video: [],
        audio: [],
      },
      subtitles: [],
    },
  };
}

/**
 * Validate media file exists
 */
export function validateMediaPath(path: string): boolean {
  return existsSync(path);
}
