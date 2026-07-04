import { z } from "zod";
import { zEasing, zFrame } from "./primitives";

/**
 * The camera model — how the whole canvas moves within a scene.
 *
 * The camera is a track of keyframes (frame-indexed transforms) that the engine
 * interpolates, plus an optional deterministic shake. Frames here are
 * *scene-local* (0 = start of the scene), so a scene's camera is self-contained
 * and reusable.
 */

/**
 * A camera position at a specific scene-local frame. The engine interpolates
 * between consecutive keyframes using `easing`, which describes the segment
 * leading *into* this keyframe.
 */
export const zCameraKeyframe = z.object({
  frame: zFrame,
  x: z.number(),
  y: z.number(),
  scale: z.number().positive(),
  rotation: z.number(),
  easing: zEasing.default("easeInOut"),
});
export type CameraKeyframe = z.infer<typeof zCameraKeyframe>;

/**
 * Deterministic camera shake. Displacement is a pure function of
 * `(seed, frame)` — never `Math.random()` — so preview and render shake
 * identically. Amplitude is in canvas units; frequency is roughly oscillations
 * per second.
 */
export const zShakeConfig = z.object({
  amplitude: z.number().min(0),
  frequency: z.number().positive(),
  seed: z.number().int(),
});
export type ShakeConfig = z.infer<typeof zShakeConfig>;

export const zCameraTrack = z
  .object({
    keyframes: z.array(zCameraKeyframe).min(1, "A camera track needs at least one keyframe"),
    shake: zShakeConfig.nullable().default(null),
  })
  .superRefine((track, ctx) => {
    // Keyframes must be strictly ascending by frame so interpolation is well
    // defined (no ambiguity about which segment a frame belongs to).
    for (let i = 1; i < track.keyframes.length; i++) {
      const prev = track.keyframes[i - 1]!;
      const curr = track.keyframes[i]!;
      if (curr.frame <= prev.frame) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["keyframes", i, "frame"],
          message: `Camera keyframes must be strictly ascending by frame (got ${curr.frame} after ${prev.frame})`,
        });
      }
    }
  });
export type CameraTrack = z.infer<typeof zCameraTrack>;

/** A convenient static camera: a single identity-ish keyframe at frame 0. */
export function staticCamera(scale = 1): CameraTrack {
  return {
    keyframes: [{ frame: 0, x: 0, y: 0, scale, rotation: 0, easing: "linear" }],
    shake: null,
  };
}
