"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { generateStoryboardAction } from "@/app/actions";
import { useEditor } from "@/store/editor";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const EXAMPLES = [
  "Explain blockchain to beginners",
  "How does HTTPS keep data safe?",
  "What is compound interest?",
  "How do vaccines work?",
];

/** Phase 1 — the prompt entry surface. */
export function PromptComposer() {
  const { prompt, setPrompt, setStoryboard, setStatus, status, error } = useEditor();
  const [pending, startTransition] = useTransition();
  const [local, setLocal] = useState(prompt);

  const submit = (value: string) => {
    const topic = value.trim();
    if (!topic || pending) return;
    setPrompt(topic);
    setStatus("storyboard");
    startTransition(async () => {
      try {
        const storyboard = await generateStoryboardAction(topic);
        setStoryboard(storyboard);
      } catch (err) {
        setStatus("error", err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center gap-8 px-6"
    >
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          Explain anything, drawn by hand.
        </h1>
        <p className="text-muted">
          Describe a topic. We storyboard it, illustrate it, and animate a whiteboard video.
        </p>
      </div>

      <div className="w-full space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-2 shadow-2xl shadow-black/40 focus-within:border-muted/40">
          <textarea
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(local);
            }}
            placeholder="Explain blockchain to beginners…"
            rows={3}
            className="w-full resize-none bg-transparent px-4 py-3 text-lg placeholder:text-muted/60 focus:outline-none"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-xs text-muted">⌘ + Enter to storyboard</span>
            <Button onClick={() => submit(local)} disabled={pending || !local.trim()}>
              {pending ? <Spinner /> : null}
              {pending ? "Storyboarding…" : "Create storyboard"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => {
                setLocal(example);
                submit(example);
              }}
              disabled={pending}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:border-muted/40 hover:text-fg disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>

        {status === "error" && error ? (
          <p className="text-center text-sm text-red-400">{error}</p>
        ) : null}
      </div>
    </motion.div>
  );
}
