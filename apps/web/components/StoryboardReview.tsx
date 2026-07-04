"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { generateProjectAction } from "@/app/actions";
import { useEditor } from "@/store/editor";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

/** Phase 2 — the human checkpoint: review and edit the storyboard before rendering. */
export function StoryboardReview() {
  const { prompt, storyboard, updateScene, setProject, setStatus, status, error, reset } =
    useEditor();
  const [pending, startTransition] = useTransition();

  if (!storyboard) return null;

  const generate = () => {
    if (pending) return;
    setStatus("project");
    startTransition(async () => {
      try {
        const project = await generateProjectAction(storyboard, prompt);
        setProject(project);
      } catch (err) {
        setStatus("error", err instanceof Error ? err.message : "Failed to generate the video.");
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <button onClick={reset} className="mb-2 text-sm text-muted hover:text-fg">
            ← New topic
          </button>
          <h2 className="text-2xl font-medium tracking-tight">{prompt}</h2>
          <p className="text-sm text-muted">
            {storyboard.scenes.length} scenes · review and tweak, then generate
          </p>
        </div>
        <Button onClick={generate} disabled={pending}>
          {pending ? <Spinner /> : null}
          {pending ? "Generating video…" : "Generate video"}
        </Button>
      </header>

      {pending ? (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-fg">
          Drawing {storyboard.scenes.reduce((n, s) => n + s.illustrationBriefs.length, 0)}{" "}
          illustrations and compiling the timeline. This can take up to a minute.
        </div>
      ) : null}

      <ol className="space-y-4">
        {storyboard.scenes.map((scene, i) => (
          <motion.li
            key={scene.index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-sm text-muted">
                {i + 1}
              </span>
              <input
                value={scene.title}
                onChange={(e) => updateScene(i, { title: e.target.value })}
                className="flex-1 bg-transparent text-lg font-medium focus:outline-none"
              />
              <span className="rounded-md bg-surface-2 px-2 py-1 text-xs text-muted">
                {scene.cameraIntent}
              </span>
            </div>

            <textarea
              value={scene.narration}
              onChange={(e) => updateScene(i, { narration: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg/90 focus:outline-none focus:ring-1 focus:ring-accent/40"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {scene.illustrationBriefs.map((brief) => (
                <span
                  key={brief}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted"
                >
                  {brief}
                </span>
              ))}
              <span className="ml-auto text-xs text-muted">{scene.durationSeconds}s</span>
            </div>
          </motion.li>
        ))}
      </ol>

      {status === "error" && error ? (
        <p className="mt-6 text-center text-sm text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
