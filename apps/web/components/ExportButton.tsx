"use client";

import { useEffect, useState } from "react";
import type { VideoProject } from "@diafram/schema";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type ExportState =
  | { phase: "idle" }
  | { phase: "rendering"; id: string; progress: number }
  | { phase: "done"; id: string }
  | { phase: "error"; message: string };

/** Kicks off an MP4 render on the worker and tracks it to a download link. */
export function ExportButton({ project }: { project: VideoProject }) {
  const [state, setState] = useState<ExportState>({ phase: "idle" });

  // Poll the job while rendering.
  useEffect(() => {
    if (state.phase !== "rendering") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/export?id=${state.id}`, { cache: "no-store" });
        const job = (await res.json()) as { status: string; progress: number; error?: string };
        if (cancelled) return;
        if (job.status === "done") setState({ phase: "done", id: state.id });
        else if (job.status === "failed") setState({ phase: "error", message: job.error ?? "Render failed" });
        else setState({ phase: "rendering", id: state.id, progress: job.progress ?? 0 });
      } catch {
        if (!cancelled) setState({ phase: "error", message: "Lost connection to the render worker" });
      }
    };
    const timer = setInterval(tick, 1200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [state]);

  const start = async () => {
    setState({ phase: "rendering", id: "", progress: 0 });
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project }),
      });
      if (!res.ok) throw new Error();
      const { id } = (await res.json()) as { id: string };
      setState({ phase: "rendering", id, progress: 0 });
    } catch {
      setState({ phase: "error", message: "Could not reach the render worker. Is it running?" });
    }
  };

  if (state.phase === "done") {
    return (
      <a href={`/api/export/download?id=${state.id}`} download>
        <Button>Download MP4</Button>
      </a>
    );
  }

  if (state.phase === "rendering") {
    return (
      <Button variant="subtle" disabled>
        <Spinner />
        Rendering {Math.round(state.progress * 100)}%
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {state.phase === "error" ? (
        <span className="max-w-[16rem] truncate text-xs text-red-400" title={state.message}>
          {state.message}
        </span>
      ) : null}
      <Button onClick={start}>Export MP4</Button>
    </div>
  );
}
