import type { DrawablePath } from "@diafram/schema";
import type { PathDrawState } from "@diafram/engine";
import { useMemo } from "react";
import { svgPathProperties } from "svg-path-properties";
import { PEN_TIP } from "./style";

/**
 * The marker nib that leads the stroke currently being drawn.
 *
 * Positioned at the live drawing head — the point `progress` of the way along
 * the active path — computed with `svg-path-properties` (the same pure-JS
 * measurer used at ingestion), so the pen sits exactly at the end of the inked
 * dash in both preview and headless render. No DOM, no `getPointAtLength()` on a
 * live element, so it stays deterministic.
 */
export type PenTipProps = {
  /** The path under the pen this frame. */
  path: DrawablePath;
  /** That path's draw state (its `progress` places the nib). */
  state: PathDrawState;
};

export function PenTip({ path, state }: PenTipProps) {
  // Parse each path's geometry once; keyed on `d` so it's reused across frames.
  const properties = useMemo(() => new svgPathProperties(path.d), [path.d]);

  const point = useMemo(() => {
    const atLength = Math.max(0, Math.min(path.length, state.progress * path.length));
    return properties.getPointAtLength(atLength);
  }, [properties, path.length, state.progress]);

  const radius = Math.max(PEN_TIP.minRadius, path.strokeWidth * PEN_TIP.radiusFactor);

  return (
    <g pointerEvents="none">
      {/* Soft ink halo, so the nib reads as wet marker rather than a hard dot. */}
      <circle cx={point.x} cy={point.y} r={radius * 1.9} fill={path.stroke} opacity={PEN_TIP.haloOpacity} />
      {/* The nib itself. */}
      <circle cx={point.x} cy={point.y} r={radius} fill={path.stroke} />
      {/* A tiny highlight for a bit of dimensionality. */}
      <circle cx={point.x - radius * 0.3} cy={point.y - radius * 0.3} r={radius * 0.32} fill="#ffffff" opacity={0.5} />
    </g>
  );
}
