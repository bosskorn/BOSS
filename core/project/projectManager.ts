// Project manager for OneCut Studio
import fs from 'fs/promises';
import path from 'path';
import type { Project, MediaItem } from '../types/project';

export class ProjectManager {
  /**
   * Create a new empty project
   */
  createNewProject(): Project {
    return {
      version: '1.0.0',
      name: 'Untitled Project',
      media: [],
      sequence: {
        fps: 30,
        width: 1920,
        height: 1080,
        tracks: {
          video: [],
          audio: [],
        },
      },
    };
  }

  /**
   * Save project to disk
   */
  async saveProject(project: Project, filePath: string): Promise<void> {
    const projectDir = path.dirname(filePath);
    
    // Convert absolute paths to relative paths
    const relativeProject = this.makePathsRelative(project, projectDir);
    
    await fs.writeFile(
      filePath,
      JSON.stringify(relativeProject, null, 2),
      'utf-8'
    );
  }

  /**
   * Load project from disk
   */
  async loadProject(filePath: string): Promise<Project> {
    const content = await fs.readFile(filePath, 'utf-8');
    const project = JSON.parse(content) as Project;
    
    const projectDir = path.dirname(filePath);
    
    // Convert relative paths back to absolute
    const absoluteProject = this.makePathsAbsolute(project, projectDir);
    
    absoluteProject.projectPath = filePath;
    absoluteProject.lastModified = new Date().toISOString();
    
    return absoluteProject;
  }

  /**
   * Convert absolute paths to relative (for saving)
   */
  private makePathsRelative(project: Project, baseDir: string): Project {
    return {
      ...project,
      media: project.media.map(m => ({
        ...m,
        path: path.relative(baseDir, m.path),
      })),
      sequence: {
        ...project.sequence,
        subtitles: project.sequence.subtitles?.map(s => ({
          ...s,
          path: path.relative(baseDir, s.path),
        })),
      },
    };
  }

  /**
   * Convert relative paths to absolute (for loading)
   */
  private makePathsAbsolute(project: Project, baseDir: string): Project {
    return {
      ...project,
      media: project.media.map(m => ({
        ...m,
        path: path.isAbsolute(m.path) ? m.path : path.join(baseDir, m.path),
      })),
      sequence: {
        ...project.sequence,
        subtitles: project.sequence.subtitles?.map(s => ({
          ...s,
          path: path.isAbsolute(s.path) ? s.path : path.join(baseDir, s.path),
        })),
      },
    };
  }

  /**
   * Add media item to project
   */
  addMediaItem(project: Project, mediaItem: MediaItem): Project {
    return {
      ...project,
      media: [...project.media, mediaItem],
    };
  }

  /**
   * Remove media item from project
   */
  removeMediaItem(project: Project, mediaId: string): Project {
    return {
      ...project,
      media: project.media.filter(m => m.id !== mediaId),
      sequence: {
        ...project.sequence,
        tracks: {
          video: project.sequence.tracks.video.filter(c => c.mediaId !== mediaId),
          audio: project.sequence.tracks.audio.filter(c => c.mediaId !== mediaId),
        },
      },
    };
  }

  /**
   * Validate project structure
   */
  validateProject(project: any): project is Project {
    return (
      project &&
      typeof project.version === 'string' &&
      Array.isArray(project.media) &&
      project.sequence &&
      project.sequence.tracks &&
      Array.isArray(project.sequence.tracks.video) &&
      Array.isArray(project.sequence.tracks.audio)
    );
  }

  /**
   * Auto-save project
   */
  async autoSave(project: Project): Promise<void> {
    if (!project.projectPath) return;
    
    const autoSavePath = project.projectPath.replace('.onecut.json', '.onecut.autosave.json');
    await this.saveProject(project, autoSavePath);
  }
}

export const projectManager = new ProjectManager();
