import { randomUUID } from "node:crypto";

/**
 * In-memory render job store.
 *
 * Deliberately minimal and process-local — enough to track a render from
 * enqueue to downloadable file. This is the seam where Postgres (job rows) and a
 * real queue land in the persistence module; the shape stays the same.
 */
export type JobStatus = "queued" | "rendering" | "done" | "failed";

export interface RenderJob {
  id: string;
  title: string;
  status: JobStatus;
  /** 0..1 while rendering. */
  progress: number;
  outputPath: string | null;
  error: string | null;
  createdAt: number;
}

export class JobStore {
  private readonly jobs = new Map<string, RenderJob>();

  create(title: string): RenderJob {
    const job: RenderJob = {
      id: randomUUID(),
      title,
      status: "queued",
      progress: 0,
      outputPath: null,
      error: null,
      createdAt: Date.now(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  get(id: string): RenderJob | null {
    return this.jobs.get(id) ?? null;
  }

  update(id: string, patch: Partial<Omit<RenderJob, "id">>): RenderJob | null {
    const job = this.jobs.get(id);
    if (!job) return null;
    const next = { ...job, ...patch };
    this.jobs.set(id, next);
    return next;
  }
}
