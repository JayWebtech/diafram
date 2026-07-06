import type { Transform, ViewBox } from "@diafram/schema";

/**
 * SVG transform-string builders.
 *
 * These translate the numeric transforms produced by the engine into the exact
 * `transform` attribute strings the SVG groups use. Kept pure and separate from
 * the React components so the coordinate conventions are unit-testable.
 */

/** Round to a fixed precision to keep transform strings stable and compact. */
function n(value: number): string {
  return Number(value.toFixed(4)).toString();
}

/**
 * Camera transform: zoom and rotate about the canvas center, then pan.
 *
 * A positive `x`/`y` pans the world (children move by that amount before the
 * centered zoom is applied), so the camera reads as "look at a point".
 */
export function cameraTransformString(camera: Transform, width: number, height: number): string {
  const cx = width / 2;
  const cy = height / 2;
  return [
    `translate(${n(cx)}, ${n(cy)})`,
    `scale(${n(camera.scale)})`,
    `rotate(${n(camera.rotation)})`,
    `translate(${n(-cx)}, ${n(-cy)})`,
    `translate(${n(camera.x)}, ${n(camera.y)})`,
  ].join(" ");
}

/**
 * Layer transform: place an illustration's viewBox origin at `(x, y)`, scaled
 * and rotated about that origin. The trailing translate maps the illustration's
 * own coordinate space (which may not start at 0,0) to the origin.
 */
export function layerTransformString(transform: Transform, viewBox: ViewBox): string {
  return [
    `translate(${n(transform.x)}, ${n(transform.y)})`,
    `scale(${n(transform.scale)})`,
    `rotate(${n(transform.rotation)})`,
    `translate(${n(-viewBox.minX)}, ${n(-viewBox.minY)})`,
  ].join(" ");
}

/**
 * Transform for a markup illustration rendered as a nested `<svg>` (which
 * establishes its own viewBox/coordinate space), so no viewBox-origin translate
 * is needed — just place, rotate, and scale.
 */
export function markupTransformString(transform: Transform): string {
  return [
    `translate(${n(transform.x)}, ${n(transform.y)})`,
    `scale(${n(transform.scale)})`,
    `rotate(${n(transform.rotation)})`,
  ].join(" ");
}
