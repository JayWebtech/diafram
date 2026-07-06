/**
 * `@diafram/ai` — the generation pipeline.
 *
 * prompt → storyboard (Step 1) → structured project (Step 2) → SVG artwork
 * (Step 3). The language model is accessed through a narrow port (`LlmPort`), so
 * the pipeline is provider-agnostic (DeepSeek today) and fully testable with a
 * fake. All SVG output is sanitized, measured, and validated before it can enter
 * a `VideoProject`.
 */

export * from "./llm/port";
export * from "./llm/deepseek";
export * from "./llm/anthropic";
export * from "./llm/factory";
export * from "./llm/fake";
export * from "./tts/port";
export * from "./tts/say";
export * from "./tts/factory";
export * from "./tts/narration";
export * from "./svg/sanitize";
export * from "./svg/measure";
export * from "./svg/ingest";
export * from "./svg/markup";
export * from "./hash";
export * from "./library";
export * from "./illustration/normalize";
export * from "./illustration/retrieve";
export * from "./illustration/embedder";
export * from "./illustration/semantic";
export * from "./illustration/source";
export * from "./illustration/library";
export * from "./illustration/default";
export * from "./illustration/starter-pack";
export * from "./illustration/packs/lucide";
export * from "./illustration/packs/people";
export * from "./agents/storyboard";
export * from "./agents/artist";
export * from "./compile/layout";
export * from "./compile/structure";
export * from "./pipeline";
