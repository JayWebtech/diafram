/**
 * Deterministic, seedable noise.
 *
 * Camera shake must look organic but be *reproducible*: the same `(seed, frame)`
 * must always yield the same displacement so the browser preview and the render
 * worker shake identically. Nothing here uses `Math.random()`.
 */

/**
 * Hash an integer lattice coordinate to a stable pseudo-random value in [-1, 1].
 * A small integer bit-mix (based on the well-known "hash without sine" family),
 * kept entirely in 32-bit integer space for cross-environment determinism.
 */
function hashLattice(n: number, seed: number): number {
  let h = (n | 0) ^ (seed | 0);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = h ^ (h >>> 16);
  // Map the unsigned 32-bit result to [-1, 1].
  return (h >>> 0) / 0xffffffff * 2 - 1;
}

/** Smoothstep, for C1-continuous interpolation between lattice samples. */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * 1D value noise sampled at position `x` (real-valued). Returns a smooth signal
 * in roughly [-1, 1] that varies continuously with `x`. Adjacent integer values
 * of `x` are independent random samples; fractional positions are smoothly
 * interpolated.
 */
export function valueNoise1D(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const a = hashLattice(i, seed);
  const b = hashLattice(i + 1, seed);
  return a + (b - a) * smoothstep(f);
}
