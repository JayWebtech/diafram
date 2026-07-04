import type { ZodType } from "zod";

/**
 * The language-model port.
 *
 * Every agent talks to the model through this narrow interface, so the pipeline
 * is provider-agnostic and fully testable with a fake (no network, no API key).
 * The DeepSeek implementation lives in `deepseek.ts`; tests use `fake.ts`.
 */
export interface LlmPort {
  /**
   * Ask the model for a JSON object conforming to a zod schema. The
   * implementation is responsible for JSON-mode prompting, parsing, validating
   * against the schema, and repairing invalid output.
   */
  generateObject<T>(args: GenerateObjectArgs<T>): Promise<T>;

  /** Ask the model for free-form text (used for raw SVG generation). */
  generateText(args: GenerateTextArgs): Promise<string>;
}

export interface GenerateObjectArgs<T> {
  /** Zod schema the returned object must satisfy. */
  schema: ZodType<T>;
  /** A short name for the schema, surfaced to the model as the JSON shape name. */
  schemaName: string;
  system: string;
  prompt: string;
  temperature?: number;
}

export interface GenerateTextArgs {
  system: string;
  prompt: string;
  temperature?: number;
}

/** Thrown when the model cannot produce schema-valid output within the retry budget. */
export class LlmValidationError extends Error {
  constructor(
    message: string,
    readonly attempts: number,
  ) {
    super(message);
    this.name = "LlmValidationError";
  }
}
