import type { Easing, Illustration, Layer, PathId } from "@diafram/schema";
import { applyEasing, clamp01 } from "./easing";

/**
 * The hand-drawing engine.
 *
 * An illustration is revealed stroke-by-stroke over the layer's draw window,
 * never by fading. Paths are drawn in `order`, and the window is allocated
 * *proportionally to path length* so a long stroke naturally takes longer than a
 * short one — the pen moves at a roughly constant speed. Everything here is a
 * pure function of the scene-local frame.
 */

/** Overall draw progress of a layer in [0, 1] (0 before it starts, 1 once complete). */
export function getLayerDrawProgress(layer: Layer, sceneLocalFrame: number): number {
  const elapsed = sceneLocalFrame - layer.startFrame;
  return clamp01(elapsed / layer.drawDurationInFrames);
}

/** Whether a layer has begun drawing (and should therefore be mounted). */
export function isLayerActive(layer: Layer, sceneLocalFrame: number): boolean {
  return sceneLocalFrame >= layer.startFrame;
}

/**
 * Generic reveal progress in [0, 1] for anything that appears at `startFrame`
 * over `durationInFrames` — used by text captions and other timed reveals.
 */
export function getRevealProgress(
  sceneLocalFrame: number,
  startFrame: number,
  durationInFrames: number,
): number {
  return clamp01((sceneLocalFrame - startFrame) / durationInFrames);
}

/** stroke-dash values that reveal a path from 0% to `progress`. */
export interface PathDrawState {
  id: PathId;
  order: number;
  /** Per-path draw progress in [0, 1]. */
  progress: number;
  /** `stroke-dasharray` — the full path length. */
  dashArray: number;
  /** `stroke-dashoffset` — the not-yet-drawn remainder. */
  dashOffset: number;
}

export interface IllustrationDrawState {
  overallProgress: number;
  paths: PathDrawState[];
}

/**
 * Compute the per-path draw state for an illustration at a scene-local frame.
 *
 * `drawEasing` shapes the overall pen speed across the whole illustration
 * (default `linear` for a steady hand). Returned paths are ordered by draw order.
 */
export function getIllustrationDrawState(
  illustration: Illustration,
  layer: Layer,
  sceneLocalFrame: number,
  drawEasing: Easing = "linear",
): IllustrationDrawState {
  const ordered = [...illustration.paths].sort((a, b) => a.order - b.order);
  const totalLength = ordered.reduce((sum, p) => sum + p.length, 0);

  const overallProgress = getLayerDrawProgress(layer, sceneLocalFrame);
  const easedProgress = applyEasing(drawEasing, overallProgress);

  // Total ink laid down so far, in path-length units, walked across the ordered
  // paths so each is fully drawn before the next begins.
  const drawnLength = easedProgress * totalLength;

  let cumulative = 0;
  const paths: PathDrawState[] = ordered.map((path) => {
    const pathDrawn = clamp01((drawnLength - cumulative) / path.length);
    cumulative += path.length;
    return {
      id: path.id,
      order: path.order,
      progress: pathDrawn,
      dashArray: path.length,
      dashOffset: path.length * (1 - pathDrawn),
    };
  });

  return { overallProgress, paths };
}

/**
 * The path currently under the pen — the one that is partway drawn at this
 * frame (`0 < progress < 1`). Returns `null` before drawing starts, between
 * strokes on an exact boundary, and once the whole illustration is complete.
 *
 * Used to place the marker/pen tip at the live drawing head. Pure, so preview
 * and render agree on where the pen is.
 */
export function getActivePath(state: IllustrationDrawState): PathDrawState | null {
  if (state.overallProgress <= 0 || state.overallProgress >= 1) return null;
  // The active stroke is the last one that has started but not yet finished.
  // Walking from the end finds the current pen position even if a later short
  // path has a progress of exactly 0.
  for (let i = state.paths.length - 1; i >= 0; i--) {
    const path = state.paths[i]!;
    if (path.progress > 0 && path.progress < 1) return path;
  }
  return null;
}
