"use client";

import { useMemo, useRef } from "react";
import type { PlayerRef } from "@remotion/player";
import { compileTimeline, getSceneAtFrame } from "@diafram/engine";
import { framesToSeconds } from "@diafram/schema";
import { useEditor } from "@/store/editor";
import { PlayerCanvas } from "@/components/PlayerCanvas";
import { ExportButton } from "@/components/ExportButton";
import { Button } from "@/components/ui/Button";

/** Phase 3 — the editor: preview, scene navigator, and timeline. */
export function Editor() {
  const { project, playhead, setPlayhead, reset } = useEditor();
  const playerRef = useRef<PlayerRef | null>(null);

  const timeline = useMemo(() => (project ? compileTimeline(project) : null), [project]);
  const activeSceneIndex = useMemo(() => {
    if (!timeline) return 0;
    return getSceneAtFrame(timeline, playhead)?.compiledScene.index ?? 0;
  }, [timeline, playhead]);

  if (!project || !timeline) return null;

  const seekTo = (frame: number) => {
    setPlayhead(frame);
    playerRef.current?.seekTo(frame);
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-baseline gap-3">
          <span className="font-medium">{project.title}</span>
          <span className="text-xs text-muted">
            {project.scenes.length} scenes · {framesToSeconds(timeline.durationInFrames, project.fps).toFixed(1)}s ·{" "}
            {project.illustrations.length} illustrations
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">
            1080p · {project.fps}fps
          </span>
          <ExportButton project={project} />
          <Button variant="subtle" onClick={reset}>
            New video
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Scene navigator */}
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-border p-3">
          <p className="px-2 pb-2 text-xs uppercase tracking-wide text-muted">Scenes</p>
          <ul className="space-y-1">
            {timeline.scenes.map((compiled) => {
              const active = compiled.index === activeSceneIndex;
              return (
                <li key={compiled.scene.id}>
                  <button
                    onClick={() => seekTo(compiled.startFrame)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2/60 hover:text-fg"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent" : "bg-border"}`} />
                      {compiled.scene.name}
                    </span>
                    <span className="mt-0.5 block truncate pl-3.5 text-xs text-muted">
                      {compiled.scene.narration || "—"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Stage */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="bg-grid flex flex-1 items-center justify-center overflow-hidden p-8">
            <div className="w-full max-w-4xl">
              <PlayerCanvas
                project={project}
                register={(p) => (playerRef.current = p)}
                onFrame={setPlayhead}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="border-t border-border px-6 py-4">
            <div className="mb-2 flex items-center justify-between text-xs text-muted">
              <span>Timeline</span>
              <span>
                {framesToSeconds(playhead, project.fps).toFixed(1)}s /{" "}
                {framesToSeconds(timeline.durationInFrames, project.fps).toFixed(1)}s
              </span>
            </div>
            <div className="flex h-10 gap-1">
              {timeline.scenes.map((compiled) => {
                const active = compiled.index === activeSceneIndex;
                const width = `${(compiled.durationInFrames / timeline.durationInFrames) * 100}%`;
                return (
                  <button
                    key={compiled.scene.id}
                    onClick={() => seekTo(compiled.startFrame)}
                    style={{ width }}
                    title={compiled.scene.name}
                    className={`h-full overflow-hidden rounded-md border px-2 text-left text-xs transition-colors ${
                      active
                        ? "border-accent/50 bg-accent-soft text-fg"
                        : "border-border bg-surface text-muted hover:border-muted/40"
                    }`}
                  >
                    <span className="block truncate leading-10">{compiled.scene.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
