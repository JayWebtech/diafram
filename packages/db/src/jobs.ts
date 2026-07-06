import { prisma } from "./client";

/**
 * Render job repository — the durable replacement for the worker's in-memory
 * job store. Jobs now survive a restart.
 */
export type JobStatus = "queued" | "rendering" | "done" | "failed";

export interface JobRecord {
  id: string;
  title: string;
  status: JobStatus;
  progress: number;
  outputKey: string | null;
  error: string | null;
  projectId: string | null;
}

type JobRow = {
  id: string;
  title: string;
  status: string;
  progress: number;
  outputKey: string | null;
  error: string | null;
  projectId: string | null;
};

const toJob = (row: JobRow): JobRecord => ({ ...row, status: row.status as JobStatus });

export async function createRenderJob(input: {
  title: string;
  projectId?: string | null;
}): Promise<JobRecord> {
  const row = await prisma.renderJob.create({
    data: { title: input.title, projectId: input.projectId ?? undefined },
  });
  return toJob(row);
}

export async function getRenderJob(id: string): Promise<JobRecord | null> {
  const row = await prisma.renderJob.findUnique({ where: { id } });
  return row ? toJob(row) : null;
}

export interface JobPatch {
  status?: JobStatus;
  progress?: number;
  outputKey?: string | null;
  error?: string | null;
}

export async function updateRenderJob(id: string, patch: JobPatch): Promise<JobRecord | null> {
  const row = await prisma.renderJob.update({ where: { id }, data: patch });
  return toJob(row);
}
