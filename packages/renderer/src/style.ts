import { valueNoise1D } from "@diafram/engine";

/**
 * Hand-drawn style constants — the single place to dial the "organic sketch"
 * aesthetic. Every value here is a pure render-time visual tweak: none of it
 * touches the stored illustration geometry, so the reuse cache and the
 * determinism guarantee are untouched.
 */

/**
 * Edge-roughening (feTurbulence + feDisplacementMap) applied per illustration.
 *
 * The absolute displacement and noise frequency must scale with the
 * illustration's own coordinate space (viewBoxes range from ~120 to ~200+
 * units), so these are expressed relative to the viewBox diagonal and resolved
 * per illustration by `roughenParams`.
 */
export const ROUGHEN = {
  /** Displacement amount as a fraction of the viewBox diagonal. */
  scaleRatio: 0.012,
  /** Noise wavelength as a fraction of the diagonal (bigger = gentler waves). */
  wavelengthRatio: 0.14,
  /** Octaves of fractal noise. 1 keeps it a clean single wobble, not fuzzy. */
  numOctaves: 1,
} as const;

/** Resolve concrete turbulence params for an illustration of the given diagonal. */
export function roughenParams(diagonal: number): { baseFrequency: number; scale: number } {
  const wavelength = Math.max(1, diagonal * ROUGHEN.wavelengthRatio);
  return {
    baseFrequency: 1 / wavelength,
    scale: diagonal * ROUGHEN.scaleRatio,
  };
}

/** Soft "sitting on paper" contact shadow under each illustration. */
export const PAPER_SHADOW = {
  dx: 0,
  dy: 1.5,
  stdDeviation: 2,
  color: "#000000",
  opacity: 0.14,
} as const;

/** Per-stroke width variation, so no two strokes are mechanically identical. */
export const STROKE_JITTER = {
  /** Max fractional deviation from the stored width (± this). 0.06 = ±6%. */
  amount: 0.06,
} as const;

/** The marker nib that leads each stroke as it draws on. */
export const PEN_TIP = {
  /** Nib radius as a multiple of the stroke width. */
  radiusFactor: 0.9,
  /** Minimum nib radius in user units (so hairline strokes still show a tip). */
  minRadius: 4,
  /** Opacity of the soft ink halo around the nib. */
  haloOpacity: 0.18,
} as const;

/**
 * A small, stable string hash → non-negative 16-bit int. Used to seed the
 * per-illustration turbulence so each icon wobbles differently, deterministically.
 */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 65536;
}

/**
 * Deterministic stroke-width multiplier in `[1 - amount, 1 + amount]` for a
 * given path id. Same id → same multiplier in preview and render.
 */
export function strokeWidthMultiplier(pathId: string): number {
  const noise = valueNoise1D(hashString(pathId) * 0.123, 1337); // [-1, 1]
  return 1 + noise * STROKE_JITTER.amount;
}
