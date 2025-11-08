import { Worker } from "worker_threads";
import { EventEmitter } from "events";
import { FFmpegProcess, FFmpegOptions, FFmpegProgress } from "../ffmpeg/index.js";
import { ExportPreset } from "../project/schema.js";

export type JobStatus = "queued" | "probing" | "rendering" | "muxing" | "done" | "failed" | "cancelled";

export interface ExportJob {
  id: string;
  status: JobStatus;
  projectPath: string;
  outputPath: string;
  preset: ExportPreset;
  options: FFmpegOptions;
  progress?: FFmpegProgress;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export class JobQueue extends EventEmitter {
  private jobs: Map<string, ExportJob> = new Map();
  private runningJobs: Set<string> = new Set();
  private maxConcurrentJobs = 1; // Process one at a time for now
  private ffmpegProcesses: Map<string, FFmpegProcess> = new Map();

  /**
   * Add a new export job to the queue
   */
  async addJob(
    projectPath: string,
    outputPath: string,
    preset: ExportPreset,
    options: FFmpegOptions
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: ExportJob = {
      id: jobId,
      status: "queued",
      projectPath,
      outputPath,
      preset,
      options: {
        ...options,
        outputFile: outputPath,
      },
      createdAt: Date.now(),
    };

    this.jobs.set(jobId, job);
    this.emit("job:added", job);

    // Start processing if we have capacity
    this.processQueue();

    return jobId;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): ExportJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): ExportJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === "queued") {
      job.status = "cancelled";
      this.jobs.delete(jobId);
      this.emit("job:cancelled", job);
      return true;
    }

    if (job.status === "probing" || job.status === "rendering" || job.status === "muxing") {
      const process = this.ffmpegProcesses.get(jobId);
      if (process) {
        process.cancel();
        this.ffmpegProcesses.delete(jobId);
      }
      job.status = "cancelled";
      this.runningJobs.delete(jobId);
      this.emit("job:cancelled", job);
      return true;
    }

    return false;
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.runningJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    // Find next queued job
    const queuedJob = Array.from(this.jobs.values()).find(
      (job) => job.status === "queued"
    );

    if (!queuedJob) {
      return;
    }

    this.runningJobs.add(queuedJob.id);
    queuedJob.status = "probing";
    queuedJob.startedAt = Date.now();
    this.emit("job:started", queuedJob);

    try {
      await this.executeJob(queuedJob);
    } catch (error) {
      queuedJob.status = "failed";
      queuedJob.error = error instanceof Error ? error.message : String(error);
      queuedJob.completedAt = Date.now();
      this.emit("job:failed", queuedJob);
    } finally {
      this.runningJobs.delete(queuedJob.id);
      this.processQueue(); // Process next job
    }
  }

  /**
   * Execute a job
   */
  private async executeJob(job: ExportJob): Promise<void> {
    const process = new FFmpegProcess();

    // Set up progress tracking
    process.on("progress", (progress: FFmpegProgress) => {
      job.progress = progress;
      job.status = "rendering";
      this.emit("job:progress", job);
    });

    process.on("complete", () => {
      job.status = "done";
      job.completedAt = Date.now();
      this.ffmpegProcesses.delete(job.id);
      this.emit("job:complete", job);
    });

    process.on("error", (error: Error) => {
      job.status = "failed";
      job.error = error.message;
      job.completedAt = Date.now();
      this.ffmpegProcesses.delete(job.id);
      this.emit("job:failed", job);
    });

    process.on("cancelled", () => {
      job.status = "cancelled";
      job.completedAt = Date.now();
      this.ffmpegProcesses.delete(job.id);
      this.emit("job:cancelled", job);
    });

    this.ffmpegProcesses.set(job.id, process);

    // Start FFmpeg process
    await process.start(job.options);
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): void {
    for (const [id, job] of this.jobs.entries()) {
      if (job.status === "done" || job.status === "failed" || job.status === "cancelled") {
        this.jobs.delete(id);
      }
    }
    this.emit("queue:cleared");
  }
}

// Singleton instance
export const jobQueue = new JobQueue();
