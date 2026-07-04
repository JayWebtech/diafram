import { svgPathProperties } from "svg-path-properties";

/**
 * Measure the total length of an SVG path's `d` string.
 *
 * Uses a pure-JS implementation (no DOM, no `getTotalLength()`), so the same
 * length is computed at ingestion time here and relied upon by the renderer.
 * This is the crux of the determinism guarantee: measure once, store the number.
 */
export function measurePathLength(d: string): number {
  const length = new svgPathProperties(d).getTotalLength();
  // A degenerate path (e.g. a bezier whose points coincide) legitimately
  // measures 0; that's not an error here — ingestion decides what to do with
  // zero-length paths. Only a non-finite/negative result is truly invalid.
  if (!Number.isFinite(length) || length < 0) {
    throw new Error(`Path has invalid length: "${d.slice(0, 40)}..."`);
  }
  return length;
}
