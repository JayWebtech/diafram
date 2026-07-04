import type { Easing } from "@diafram/schema";

/**
 * The easing table.
 *
 * This is the *authoritative* implementation of every easing name in the schema
 * enum. Both the camera engine and the draw engine ease through these functions,
 * so preview and render share the exact same curves. Each function maps a
 * normalized input `t` in [0, 1] to an eased output, with `f(0) === 0` and
 * `f(1) === 1`.
 */
export const EASING_FUNCTIONS: Record<Easing, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  circIn: (t) => 1 - Math.sqrt(1 - t * t),
  circOut: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  circInOut: (t) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
};

/** Apply a named easing to a value, clamping the input to [0, 1] first. */
export function applyEasing(easing: Easing, t: number): number {
  const clamped = clamp01(t);
  return EASING_FUNCTIONS[easing](clamped);
}

/** Clamp a number to the inclusive [0, 1] range. */
export function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
