import { z } from "zod";

/**
 * Shared scalar building blocks reused across the schema.
 *
 * Everything here is intentionally small and composable so higher-level schemas
 * read declaratively. Nothing in this file knows about scenes, layers, or the
 * render pipeline — these are pure value types.
 */

/** A non-negative integer frame index. All time in the model is measured in frames. */
export const zFrame = z.number().int().min(0);

/** A strictly positive integer duration in frames (a thing that lasts at least 1 frame). */
export const zDurationFrames = z.number().int().positive();

/** A value clamped to the inclusive [0, 1] range (progress, opacity, normalized amounts). */
export const zNormalized = z.number().min(0).max(1);

/**
 * A CSS hex color: `#rgb` or `#rrggbb` (case-insensitive).
 *
 * We deliberately reject named colors and rgb()/hsl() so downstream code never
 * has to parse anything but hex, and the render output is unambiguous.
 */
export const zHexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Expected a hex color like #111 or #1a1a1a");

/** Named easing functions. Must stay in lockstep with the engine's easing table. */
export const EASINGS = [
  "linear",
  "easeIn",
  "easeOut",
  "easeInOut",
  "circIn",
  "circOut",
  "circInOut",
] as const;
export const zEasing = z.enum(EASINGS);
export type Easing = z.infer<typeof zEasing>;

/**
 * A 2D affine placement applied to a layer or the camera.
 *
 * `x`/`y` are in canvas user units and may be negative (things can sit off to
 * the left/top). `scale` must be positive. `rotation` is in degrees, clockwise.
 */
export const zTransform = z.object({
  x: z.number(),
  y: z.number(),
  scale: z.number().positive(),
  rotation: z.number(),
});
export type Transform = z.infer<typeof zTransform>;

/** The identity transform — no translation, unit scale, no rotation. */
export const IDENTITY_TRANSFORM: Transform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
};

/**
 * An SVG viewBox as a structured value rather than a space-separated string,
 * so the renderer and engine can do math on it without parsing.
 */
export const zViewBox = z.object({
  minX: z.number(),
  minY: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});
export type ViewBox = z.infer<typeof zViewBox>;
