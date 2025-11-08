// Job queue manager for OneCut Studio
import { EventEmitter } from 'events';
import type { JobProgress, ExportSettings, Project } from '../types/project';
import { ffmpeg } from '../ffmpeg/ffmpeg';

interface Job {
  id: string;
  type: 'export' | 'probe';
  project?: Project;
  settings?: ExportSettings;
  status: JobProgress['status'];
  progress: number;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export class JobQueue extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private activeJobs: Set<string> = new Set();
  private maxConcurrent = 1; // Process one job at a time for now

  /**
   * Add export job to queue
   */
  addExportJob(project: Project, settings: ExportSettings): string {
    const jobId = this.generateJobId();
    
    const job: Job = {
      id: jobId,
      type: 'export',
      project,
      settings,
      status: 'queued',
      progress: 0,
    };

    this.jobs.set(jobId, job);
    this.emit('jobAdded', job);
    
    // Start processing
    this.processQueue();
    
    return jobId;
  }

  /**
   * Cancel job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'queued') {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      this.emit('jobUpdated', job);
      return true;
    }

    // For active jobs, we'd need to kill the FFmpeg process
    // This would require storing the process reference
    return false;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Process job queue
   */
  private async processQueue(): Promise<void> {
    if (this.activeJobs.size >= this.maxConcurrent) return;

    const queuedJobs = Array.from(this.jobs.values())
      .filter(j => j.status === 'queued');

    if (queuedJobs.length === 0) return;

    const job = queuedJobs[0];
    this.activeJobs.add(job.id);

    try {
      await this.processJob(job);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('jobUpdated', job);
    } finally {
      this.activeJobs.delete(job.id);
      this.processQueue(); // Process next job
    }
  }

  /**
   * Process individual job
   */
  private async processJob(job: Job): Promise<void> {
    job.status = 'probing';
    job.startTime = Date.now();
    this.emit('jobUpdated', job);

    if (job.type === 'export' && job.project && job.settings) {
      job.status = 'rendering';
      this.emit('jobUpdated', job);

      await ffmpeg.export(
        job.project,
        job.settings,
        (progress) => {
          job.progress = progress.progress || 0;
          this.emit('jobProgress', {
            jobId: job.id,
            ...progress,
          });
        }
      );

      job.status = 'done';
      job.progress = 100;
      job.endTime = Date.now();
      this.emit('jobUpdated', job);
    }
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear completed jobs
   */
  clearCompletedJobs(): void {
    const completedJobs = Array.from(this.jobs.entries())
      .filter(([_, job]) => job.status === 'done' || job.status === 'failed');

    for (const [id] of completedJobs) {
      this.jobs.delete(id);
    }

    this.emit('jobsCleared');
  }
}

export const jobQueue = new JobQueue();
