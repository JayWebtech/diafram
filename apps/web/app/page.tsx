"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEditor } from "@/store/editor";
import { PromptComposer } from "@/components/PromptComposer";
import { StoryboardReview } from "@/components/StoryboardReview";
import { Editor } from "@/components/Editor";

export default function Page() {
  const phase = useEditor((s) => s.phase);

  // The editor takes over the full viewport with its own chrome.
  if (phase === "editor") return <Editor />;

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-2 px-6 py-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-sm font-bold text-black">
          d
        </span>
        <span className="text-sm font-medium tracking-tight">diafram</span>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {phase === "prompt" ? <PromptComposer /> : null}
          {phase === "storyboard" ? <StoryboardReview /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
