import { createReadStream, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { zVideoProject } from "@diafram/schema";
import { resolveBackend, type RenderRequest } from "./backend";
import { JobStore } from "./jobs";

/**
 * The render worker HTTP service.
 *
 * A standalone process (not inside Next) that owns the job store and drives the
 * render backend. The web app talks to it over HTTP: POST a project to enqueue,
 * poll for progress, download the finished MP4. In production this becomes a
 * queue-fed fleet (or Lambda) behind the same three endpoints.
 */
const PORT = Number(process.env.RENDER_PORT ?? 3939);
const store = new JobStore();
const backend = resolveBackend();

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(payload);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** Kick off a render in the background, streaming progress into the job store. */
function startRender(jobId: string, request: RenderRequest): void {
  store.update(jobId, { status: "rendering" });
  backend
    .render(jobId, request, (progress) => store.update(jobId, { progress }))
    .then(({ outputPath }) => store.update(jobId, { status: "done", progress: 1, outputPath }))
    .catch((err: unknown) => {
      store.update(jobId, {
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
    });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const { pathname } = url;

  if (req.method === "OPTIONS") return json(res, 204, {});
  if (pathname === "/health") return json(res, 200, { ok: true });

  // POST /render — enqueue a render.
  if (req.method === "POST" && pathname === "/render") {
    try {
      const body = JSON.parse(await readBody(req)) as { project?: unknown; frameRange?: [number, number] };
      const project = zVideoProject.parse(body.project);
      const job = store.create(project.title);
      startRender(job.id, { project, frameRange: body.frameRange });
      return json(res, 202, { id: job.id });
    } catch (err) {
      return json(res, 400, { error: err instanceof Error ? err.message : "Invalid request" });
    }
  }

  // GET /render/:id and /render/:id/download
  const match = pathname.match(/^\/render\/([\w-]+)(\/download)?$/);
  if (req.method === "GET" && match) {
    const job = store.get(match[1]!);
    if (!job) return json(res, 404, { error: "Job not found" });

    if (match[2]) {
      if (job.status !== "done" || !job.outputPath) {
        return json(res, 409, { error: "Render not finished" });
      }
      const size = statSync(job.outputPath).size;
      res.writeHead(200, {
        "content-type": "video/mp4",
        "content-length": size,
        "content-disposition": `attachment; filename="${sanitizeFilename(job.title)}.mp4"`,
        "access-control-allow-origin": "*",
      });
      return void createReadStream(job.outputPath).pipe(res);
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

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w -]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "explainer";
}

server.listen(PORT, () => {
  console.log(`diafram render worker listening on http://localhost:${PORT} (backend: ${process.env.RENDER_BACKEND ?? "local"})`);
});
