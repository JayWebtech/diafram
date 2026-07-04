/**
 * `@diafram/engine` — the deterministic math that turns a `VideoProject` and a
 * frame number into concrete animation values.
 *
 * Everything here is a pure function: no React, no Remotion, no DOM, no
 * `Date.now()`, no `Math.random()`. That constraint is the whole determinism
 * guarantee — the browser preview and the headless render feed the same frame in
 * and get the same numbers out.
 */

export * from "./easing";
export * from "./interpolate";
export * from "./rng";
export * from "./camera";
export * from "./draw";
export * from "./timeline";
