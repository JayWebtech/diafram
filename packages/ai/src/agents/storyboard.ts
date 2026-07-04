import {
  CAMERA_INTENTS,
  newStoryboardId,
  zStoryboard,
  zStoryboardTransition,
  type Storyboard,
} from "@diafram/schema";
import { z } from "zod";
import type { LlmPort } from "../llm/port";

/**
 * Storyboard agent — Step 1 of the pipeline.
 *
 * Produces the human-reviewable storyboard from a raw prompt. The model returns
 * a *draft* (no ids, no indices — it shouldn't invent those); we then stamp ids
 * and contiguous indices and validate against the strict `zStoryboard` schema.
 */

const zStoryboardDraft = z.object({
  audience: z.string().default(""),
  scenes: z
    .array(
      z.object({
        title: z.string().min(1),
        narration: z.string(),
        visualDescription: z.string().min(1),
        durationSeconds: z.number().positive(),
        cameraIntent: z.enum(CAMERA_INTENTS),
        illustrationBriefs: z.array(z.string().min(1)).min(1),
        transition: zStoryboardTransition,
      }),
    )
    .min(1),
});

const SYSTEM = `You are a storyboard director for hand-drawn whiteboard explainer videos.
Given a topic, break it into 3-6 short scenes that build understanding step by step.
For each scene provide: a short title, one or two sentences of narration, a concrete
visual description, a duration in seconds (4-9), a camera intent, an ordered list of
1-3 illustration briefs (each a short noun phrase describing a single minimalist,
hand-drawn black-and-white icon, e.g. "closed padlock", "open notebook"), and a
transition. Keep illustration briefs reusable and generic so the same drawing can
appear across videos. Camera intent must be one of: ${CAMERA_INTENTS.join(", ")}.
Transition must be one of: cut, fade, slide, zoom, whipPan.`;

export interface StoryboardRequest {
  prompt: string;
  audience?: string;
}

export async function generateStoryboard(
  llm: LlmPort,
  request: StoryboardRequest,
): Promise<Storyboard> {
  const draft = await llm.generateObject({
    schema: zStoryboardDraft,
    schemaName: "Storyboard",
    system: SYSTEM,
    prompt: request.audience
      ? `Topic: ${request.prompt}\nAudience: ${request.audience}`
      : `Topic: ${request.prompt}`,
    temperature: 0.8,
  });

  return zStoryboard.parse({
    id: newStoryboardId(),
    prompt: request.prompt,
    audience: request.audience ?? draft.audience,
    scenes: draft.scenes.map((scene, index) => ({ ...scene, index })),
  });
}
