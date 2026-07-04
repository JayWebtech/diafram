import { RENDER_WORKER_URL } from "@/lib/render";

/**
 * Export proxy. Keeps the render worker URL server-side and gives the browser a
 * same-origin surface. POST enqueues a render; GET?id polls its status.
 */
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as { project?: unknown };
  const res = await fetch(`${RENDER_WORKER_URL}/render`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ project: body.project }),
  });
  return Response.json(await res.json(), { status: res.status });
}

export async function GET(req: Request): Promise<Response> {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "missing id" }, { status: 400 });
  const res = await fetch(`${RENDER_WORKER_URL}/render/${id}`, { cache: "no-store" });
  return Response.json(await res.json(), { status: res.status });
}
