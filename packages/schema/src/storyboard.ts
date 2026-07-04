import { z } from "zod";
import { zStoryboardId } from "./ids";

/**
 * The storyboard — the Step 1 human checkpoint, before any structured render
 * data or artwork exists.
 *
 * It is intentionally loose and human-readable (durations in seconds, free-text
 * briefs) because the user reviews and edits it. The structuring agent later
 * compiles an approved storyboard into a strict `VideoProject`.
 */

/** High-level camera intent for a scene, later expanded into a keyframe track. */
export const CAMERA_INTENTS = ["static", "zoom", "pan", "focus", "shake"] as const;
export const zCameraIntent = z.enum(CAMERA_INTENTS);
export type CameraIntent = z.infer<typeof zCameraIntent>;

/** Transition intent, mirroring the render-level scene transitions. */
export const zStoryboardTransition = z.enum(["cut", "fade", "slide", "zoom", "whipPan"]);

export const zStoryboardScene = z.object({
  /** 0-based position in the storyboard. */
  index: z.number().int().min(0),
  title: z.string().min(1),
  narration: z.string(),
  /** What the viewer should see — the brief the SVG artist agent works from. */
  visualDescription: z.string().min(1),
  /** Editable duration in seconds; converted to frames during structuring. */
  durationSeconds: z.number().positive(),
  cameraIntent: zCameraIntent.default("static"),
  /** One brief per illustration to generate for this scene. */
  illustrationBriefs: z.array(z.string().min(1)),
  transition: zStoryboardTransition.default("cut"),
});
export type StoryboardScene = z.infer<typeof zStoryboardScene>;

export const zStoryboard = z
  .object({
    id: zStoryboardId,
    /** The original user prompt that produced this storyboard. */
    prompt: z.string().min(1),
    /** Optional audience descriptor, e.g. "beginners". */
    audience: z.string().default(""),
    scenes: z.array(zStoryboardScene).min(1, "A storyboard needs at least one scene"),
  })
  .superRefine((storyboard, ctx) => {
    // Scene indices should be contiguous and ordered so the editor can rely on
    // position === array order.
    storyboard.scenes.forEach((scene, i) => {
      if (scene.index !== i) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scenes", i, "index"],
          message: `Storyboard scene index ${scene.index} does not match its position ${i}`,
        });
      }
    });
  });
export type Storyboard = z.infer<typeof zStoryboard>;
