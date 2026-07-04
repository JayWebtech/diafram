import { z } from "zod";
import { zIllustrationId, zLayerId } from "./ids";
import { zDurationFrames, zFrame, zNormalized, zTransform } from "./primitives";

/**
 * A layer places one illustration into a scene and says when to draw it.
 *
 * Time fields are *scene-local* frames. A layer never fades in — it is revealed
 * stroke-by-stroke over `drawDurationInFrames` starting at `startFrame`, in the
 * illustration's own path order. `opacity` exists for static compositing (e.g. a
 * faint background element), not for entrance animation.
 */
export const zLayer = z.object({
  id: zLayerId,
  /** Which illustration to draw. Must exist in the project's illustration set. */
  illustrationId: zIllustrationId,
  /** Scene-local frame at which drawing begins. */
  startFrame: zFrame,
  /** How long the hand-drawing takes, in frames. */
  drawDurationInFrames: zDurationFrames,
  /** Placement of the illustration on the canvas. */
  transform: zTransform,
  /**
   * Stacking order across layers in the scene; higher is painted on top. Kept
   * separate from the illustration's internal path order.
   */
  drawOrder: z.number().int(),
  /** Static opacity for compositing. Defaults to fully opaque. */
  opacity: zNormalized.default(1),
});
export type Layer = z.infer<typeof zLayer>;
