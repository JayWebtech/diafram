import { z } from "zod";
import { DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH } from "./constants";
import { zIllustrationId, zPathId } from "./ids";
import { zHexColor, zViewBox } from "./primitives";

/**
 * The illustration model — the artwork half of the contract.
 *
 * An illustration is a normalized, render-ready description of a hand-drawn SVG:
 * an ordered list of stroked paths inside a viewBox. It carries no animation
 * state itself; *how* and *when* it is drawn is decided by the layer that
 * references it. This keeps illustrations reusable across projects.
 */

/**
 * A single drawable path.
 *
 * `length` is the total path length in user units, precomputed at ingestion via
 * a pure-JS path measurer. Storing it here is a deliberate determinism choice:
 * the renderer never calls `getTotalLength()`, so the browser preview and the
 * headless render agree exactly on stroke-dash math.
 */
export const zDrawablePath = z.object({
  id: zPathId,
  /** Raw SVG path data (`d` attribute). */
  d: z.string().min(1),
  /** Draw order within the illustration; lower is drawn first. */
  order: z.number().int().min(0),
  /** Precomputed total path length, in user units. Strictly positive. */
  length: z.number().positive(),
  /** Stroke weight in user units. */
  strokeWidth: z.number().positive().default(DEFAULT_STROKE_WIDTH),
  /** Stroke (ink) color. */
  stroke: zHexColor.default(DEFAULT_STROKE_COLOR),
  /**
   * Optional fill, applied only after the stroke finishes drawing. `null` means
   * an unfilled outline (the common case for the whiteboard style).
   */
  fill: zHexColor.nullable().default(null),
});
export type DrawablePath = z.infer<typeof zDrawablePath>;

/**
 * How an illustration is revealed on screen:
 *  - `stroke`: hand-drawing via stroke-dash (line art) — the default.
 *  - `wipe`: a directional clip reveal, for filled artwork that can't be "drawn"
 *    stroke-by-stroke (e.g. colored hand-drawn people).
 */
export const REVEAL_MODES = ["stroke", "wipe"] as const;
export const zRevealMode = z.enum(REVEAL_MODES);
export type RevealMode = z.infer<typeof zRevealMode>;

export const zIllustration = z
  .object({
    id: zIllustrationId,
    /** Human/AI-facing label, e.g. "closed padlock". */
    name: z.string().min(1),
    viewBox: zViewBox,
    /** Ordered stroked paths (for `stroke` reveal). Empty when `markup` is used. */
    paths: z.array(zDrawablePath).default([]),
    /**
     * Trusted, self-contained inner SVG markup for filled artwork rendered
     * wholesale and revealed by a `wipe`. When set, `paths` is empty.
     */
    markup: z.string().nullable().default(null),
    reveal: zRevealMode.default("stroke"),
    /** Optional single accent color permitted by the style rules. */
    accentColor: zHexColor.nullable().default(null),
    /**
     * Hash of the normalized semantic prompt used to generate this illustration.
     * Enables the content-addressed reuse library (draw a "lock" once, reuse it).
     */
    promptHash: z.string().nullable().default(null),
    /** Style-guide version this artwork was generated under. */
    styleVersion: z.number().int().min(1).default(1),
  })
  .superRefine((ill, ctx) => {
    if (ill.paths.length === 0 && !ill.markup) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paths"],
        message: "An illustration needs at least one path or markup",
      });
    }
  });
export type Illustration = z.infer<typeof zIllustration>;
