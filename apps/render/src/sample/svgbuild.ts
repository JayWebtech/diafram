/**
 * Tiny build-time helpers for hand-authoring sample illustrations.
 *
 * These construct path `d` strings *and* their exact lengths analytically, which
 * is why the sample needs no runtime measurement — it mirrors what the AI
 * ingestion step will do (measure once, store the length). Polyline length is an
 * exact sum of segment distances; arcs are approximated by a dense polyline.
 */

export type Point = readonly [number, number];

export interface BuiltPath {
  d: string;
  length: number;
}

/** Build an open polyline through the given points. */
export function polyline(points: readonly Point[]): BuiltPath {
  const first = points[0]!;
  let d = `M ${first[0]} ${first[1]}`;
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]!;
    const [x1, y1] = points[i]!;
    d += ` L ${x1} ${y1}`;
    length += Math.hypot(x1 - x0, y1 - y0);
  }
  return { d, length };
}

/** Sample an arc into points (degrees, counter-clockwise-positive in SVG space). */
export function arcPoints(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
  steps = 24,
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = startDeg + ((endDeg - startDeg) * i) / steps;
    const rad = (t * Math.PI) / 180;
    points.push([cx + r * Math.cos(rad), cy + r * Math.sin(rad)]);
  }
  return points;
}
