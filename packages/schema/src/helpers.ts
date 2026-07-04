import type { ViewBox } from "./primitives";

/**
 * Small pure helpers that live with the schema because they operate directly on
 * schema value types. Anything more involved belongs in `@diafram/engine`.
 */

/** Convert a structured viewBox into the SVG `viewBox` attribute string. */
export function viewBoxToString(viewBox: ViewBox): string {
  return `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`;
}

/** Convert seconds to whole frames at a given fps (rounded to the nearest frame). */
export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

/** Convert frames back to seconds at a given fps. */
export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}
