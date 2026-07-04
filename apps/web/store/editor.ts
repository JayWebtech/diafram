"use client";

import type { Storyboard, StoryboardScene, VideoProject } from "@diafram/schema";
import { create } from "zustand";

/**
 * The editor document store.
 *
 * Holds the in-flight storyboard and compiled project plus the flow phase. The
 * server actions do the generation; this store is the single client-side source
 * of truth the UI renders from and the Player reads its `inputProps` from.
 */
export type Phase = "prompt" | "storyboard" | "editor";
export type Status = "idle" | "storyboard" | "project" | "error";

interface EditorState {
  phase: Phase;
  status: Status;
  error: string | null;

  prompt: string;
  storyboard: Storyboard | null;
  project: VideoProject | null;

  /** Global playhead frame, kept in sync with the Player. */
  playhead: number;
  /** Index of the scene currently focused in the editor. */
  activeSceneIndex: number;

  setPrompt: (prompt: string) => void;
  setStatus: (status: Status, error?: string | null) => void;

  setStoryboard: (storyboard: Storyboard) => void;
  updateScene: (index: number, patch: Partial<StoryboardScene>) => void;

  setProject: (project: VideoProject) => void;
  setPlayhead: (frame: number) => void;
  setActiveScene: (index: number) => void;

  reset: () => void;
}

export const useEditor = create<EditorState>((set) => ({
  phase: "prompt",
  status: "idle",
  error: null,

  prompt: "",
  storyboard: null,
  project: null,

  playhead: 0,
  activeSceneIndex: 0,

  setPrompt: (prompt) => set({ prompt }),
  setStatus: (status, error = null) => set({ status, error }),

  setStoryboard: (storyboard) =>
    set({ storyboard, phase: "storyboard", status: "idle", error: null }),

  updateScene: (index, patch) =>
    set((state) => {
      if (!state.storyboard) return state;
      const scenes = state.storyboard.scenes.map((scene, i) =>
        i === index ? { ...scene, ...patch } : scene,
      );
      return { storyboard: { ...state.storyboard, scenes } };
    }),

  setProject: (project) =>
    set({ project, phase: "editor", status: "idle", error: null, playhead: 0, activeSceneIndex: 0 }),

  setPlayhead: (playhead) => set({ playhead }),
  setActiveScene: (activeSceneIndex) => set({ activeSceneIndex }),

  reset: () =>
    set({
      phase: "prompt",
      status: "idle",
      error: null,
      storyboard: null,
      project: null,
      playhead: 0,
      activeSceneIndex: 0,
    }),
}));
