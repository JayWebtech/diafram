/**
 * `@diafram/renderer` — the shared React video renderer.
 *
 * These components consume `@diafram/engine` and are driven entirely by
 * Remotion's `useCurrentFrame()`. The exact same tree renders the live editor
 * preview (`@remotion/player`) and the final MP4 (render worker), which is what
 * makes "what you see is what you get" structural rather than a QA promise.
 */

export * from "./geometry";
export * from "./transitions";
export * from "./DrawPath";
export * from "./IllustrationLayer";
export * from "./TextElement";
export * from "./SceneRenderer";
export * from "./VideoComposition";
