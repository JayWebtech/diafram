import { RENDER_WORKER_URL } from "@/lib/render";

/** Streams the finished MP4 from the render worker back to the browser. */
export async function GET(req: Request): Promise<Response> {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "missing id" }, { status: 400 });

  const res = await fetch(`${RENDER_WORKER_URL}/render/${id}/download`, { cache: "no-store" });
  if (!res.ok || !res.body) {
    return Response.json({ error: "render not ready" }, { status: 409 });
  }

  return new Response(res.body, {
    headers: {
      "content-type": "video/mp4",
      "content-disposition": res.headers.get("content-disposition") ?? 'attachment; filename="explainer.mp4"',
    },
  });
}
