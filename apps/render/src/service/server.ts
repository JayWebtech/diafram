import { readFileSync, unlinkSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { zVideoProject, type VideoProject } from "@diafram/schema";
import { createRenderJob, getRenderJob, updateRenderJob } from "@diafram/db";
import { createStorage } from "@diafram/storage";
import { renderProjectToFile } from "./render";

/**
 * The render worker HTTP service.
 *
 * A standalone process (not inside Next) that persists jobs to Postgres and
 * writes finished MP4s to object storage (R2 in prod, local in dev). The web app
 * talks to it over HTTP: POST a project to enqueue, poll status, download the
 * stored MP4. Jobs now survive a restart.
 */
const PORT = Number(process.env.RENDER_PORT ?? 3939);
const storage = createStorage();

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** Render in the background: temp file → object storage, progress → job row. */
function startRender(jobId: string, project: VideoProject, frameRange?: [number, number]): void {
  void (async () => {
    const tmpPath = join(tmpdir(), `diafram-${jobId}.mp4`);
    try {
      await updateRenderJob(jobId, { status: "rendering" });
      let lastPct = -1;
      await renderProjectToFile({
        project,
        outputPath: tmpPath,
        frameRange,
        onProgress: (progress) => {
          const pct = Math.floor(progress * 100);
          if (pct !== lastPct) {
            lastPct = pct;
            void updateRenderJob(jobId, { progress }).catch(() => {});
          }
        },
      });
      const key = `renders/${jobId}.mp4`;
      await storage.put(key, readFileSync(tmpPath), "video/mp4");
      await updateRenderJob(jobId, { status: "done", progress: 1, outputKey: key });
    } catch (err) {
      await updateRenderJob(jobId, {
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      }).catch(() => {});
    } finally {
      try {
        unlinkSync(tmpPath);
      } catch {
        /* temp file may not exist */
      }
    }
  })();
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w -]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "explainer";
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const { pathname } = url;

  if (req.method === "OPTIONS") return json(res, 204, {});
  if (pathname === "/health") return json(res, 200, { ok: true });

  if (req.method === "POST" && pathname === "/render") {
    try {
      const body = JSON.parse(await readBody(req)) as {
        project?: unknown;
        frameRange?: [number, number];
      };
      const project = zVideoProject.parse(body.project);
      const job = await createRenderJob({ title: project.title });
      startRender(job.id, project, body.frameRange);
      return json(res, 202, { id: job.id });
    } catch (err) {
      return json(res, 400, { error: err instanceof Error ? err.message : "Invalid request" });
    }
  }

  const match = pathname.match(/^\/render\/([\w-]+)(\/download)?$/);
  if (req.method === "GET" && match) {
    const job = await getRenderJob(match[1]!);
    if (!job) return json(res, 404, { error: "Job not found" });

    if (match[2]) {
      if (job.status !== "done" || !job.outputKey) {
        return json(res, 409, { error: "Render not finished" });
      }
      const buffer = await storage.get(job.outputKey);
      res.writeHead(200, {
        "content-type": "video/mp4",
        "content-length": buffer.length,
        "content-disposition": `attachment; filename="${sanitizeFilename(job.title)}.mp4"`,
        "access-control-allow-origin": "*",
      });
      return void res.end(buffer);
    }

    return json(res, 200, {
      id: job.id,
      title: job.title,
      status: job.status,
      progress: job.progress,
      error: job.error,
    });
  }

  return json(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(
    `diafram render worker on http://localhost:${PORT} (storage: ${process.env.STORAGE_BACKEND ?? "local"})`,
  );
});
