import type { Easing } from "@diafram/schema";
import { applyEasing } from "./easing";

/** Linear interpolation between `a` and `b` by `t`. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface InterpolateOptions {
  /** Easing applied to the normalized position within the input range. */
  easing?: Easing;
  /** Clamp the output to the output range's endpoints. Defaults to true. */
  clamp?: boolean;
}

/**
 * Map a value from an input range to an output range, with optional easing —
 * the engine's own deterministic equivalent of Remotion's `interpolate`.
 *
 * We implement this here (rather than importing Remotion's) so the engine stays
 * React/Remotion-free and remains the single source of truth for any math that
 * affects rendered output.
 */
export function interpolate(
  input: number,
  inputRange: readonly [number, number],
  outputRange: readonly [number, number],
  options: InterpolateOptions = {},
): number {
  const { easing = "linear", clamp = true } = options;
  const [inMin, inMax] = inputRange;
  const [outMin, outMax] = outputRange;

  // Degenerate input range: nothing to interpolate across.
  if (inMin === inMax) return outMin;

  let progress = (input - inMin) / (inMax - inMin);
  if (clamp) {
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;
  }

  const eased = clamp ? applyEasing(easing, progress) : easeUnclamped(easing, progress);
  return lerp(outMin, outMax, eased);
}

/**
 * When clamping is disabled the caller wants extrapolation, so we pass the raw
 * progress through the easing only within [0, 1] and stay linear outside it to
 * avoid the curve functions producing NaNs (e.g. sqrt of a negative).
 */
function easeUnclamped(easing: Easing, progress: number): number {
  if (progress < 0 || progress > 1) return progress;
  return applyEasing(easing, progress);
}
