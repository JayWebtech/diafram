"use server";

import { generateProjectFromStoryboard, generateStoryboard } from "@diafram/ai";
import { zStoryboard, type Storyboard, type VideoProject } from "@diafram/schema";
import { getLlmPort } from "@/lib/llm";

const ACCENT = "#f97316";

/** Step 1: turn a prompt into a reviewable storyboard. */
export async function generateStoryboardAction(
  prompt: string,
  audience?: string,
): Promise<Storyboard> {
  if (!prompt.trim()) throw new Error("Please enter a topic to explain.");
  return generateStoryboard(getLlmPort(), { prompt: prompt.trim(), audience });
}

/**
 * Steps 2 & 3: generate artwork for an approved storyboard and compile the
 * render-ready project. The storyboard is re-validated at the trust boundary.
 */
export async function generateProjectAction(
  storyboardInput: Storyboard,
  title: string,
): Promise<VideoProject> {
  const storyboard = zStoryboard.parse(storyboardInput);
  return generateProjectFromStoryboard({
    llm: getLlmPort(),
    storyboard,
    title,
    accentColor: ACCENT,
  });
}
