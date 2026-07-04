/**
 * Global, render-critical constants.
 *
 * These are the numbers that both the browser preview (`@remotion/player`) and
 * the headless render worker must agree on. Change them in exactly one place.
 */

/** Frames per second for every composition. The timeline is expressed in frames. */
export const DEFAULT_FPS = 30;

/** Output resolution — 1080p, matching the render pipeline target. */
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

/** Default hand-drawn stroke weight, in SVG user units. */
export const DEFAULT_STROKE_WIDTH = 8;

/** Default ink color for illustration strokes (near-black, not pure #000). */
export const DEFAULT_STROKE_COLOR = "#111111";

/**
 * Bump when a breaking change is made to the persisted `VideoProject` shape so
 * migrations can be applied on read. Kept next to the schema it versions.
 */
export const SCHEMA_VERSION = 1;
