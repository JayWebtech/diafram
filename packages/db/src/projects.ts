import type { Prisma } from "@prisma/client";
import {
  zStoryboard,
  zVideoProject,
  type Storyboard,
  type VideoProject,
} from "@diafram/schema";
import { prisma } from "./client";

/**
 * Project repository. The storyboard and compiled VideoProject are stored as
 * validated JSON and re-validated on read, so the DB can never hand back a
 * malformed document.
 */
export interface ProjectRecord {
  id: string;
  title: string;
  prompt: string;
  storyboard: Storyboard | null;
  videoProject: VideoProject | null;
  createdAt: Date;
  updatedAt: Date;
}

type ProjectRow = {
  id: string;
  title: string;
  prompt: string;
  storyboard: unknown;
  videoProject: unknown;
  createdAt: Date;
  updatedAt: Date;
};

const asJson = (value: unknown): Prisma.InputJsonValue | undefined =>
  value == null ? undefined : (value as Prisma.InputJsonValue);

function toRecord(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    storyboard: row.storyboard ? zStoryboard.parse(row.storyboard) : null,
    videoProject: row.videoProject ? zVideoProject.parse(row.videoProject) : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface CreateProjectInput {
  title: string;
  prompt: string;
  storyboard?: Storyboard | null;
  videoProject?: VideoProject | null;
}

export async function createProject(input: CreateProjectInput): Promise<ProjectRecord> {
  const row = await prisma.project.create({
    data: {
      title: input.title,
      prompt: input.prompt,
      storyboard: asJson(input.storyboard),
      videoProject: asJson(input.videoProject),
    },
  });
  return toRecord(row);
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  const row = await prisma.project.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export async function listProjects(limit = 50): Promise<ProjectRecord[]> {
  const rows = await prisma.project.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  return rows.map(toRecord);
}

export async function saveProjectVideo(
  id: string,
  videoProject: VideoProject,
): Promise<ProjectRecord> {
  const row = await prisma.project.update({
    where: { id },
    data: { videoProject: videoProject as unknown as Prisma.InputJsonValue },
  });
  return toRecord(row);
}
