/**
 * `@diafram/schema` — the single source of truth for the video document.
 *
 * The Zod schemas here define the contract shared by the AI pipeline (structured
 * outputs), the database (validated JSON), the editor state, and the renderer.
 * If a type is used in more than one package, it is defined here.
 */

export * from "./constants";
export * from "./primitives";
export * from "./ids";
export * from "./illustration";
export * from "./camera";
export * from "./layer";
export * from "./text";
export * from "./scene";
export * from "./project";
export * from "./storyboard";
export * from "./helpers";
