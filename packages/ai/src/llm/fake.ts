import type {
  GenerateObjectArgs,
  GenerateTextArgs,
  LlmPort,
} from "./port";

/**
 * A scripted fake LLM for tests.
 *
 * Queue up object/text responses in the order they'll be requested. Object
 * responses are still validated against the caller's schema, so tests exercise
 * the real validation path. Call counts are exposed for assertions (e.g. proving
 * the reuse library avoids duplicate artwork generation).
 */
export class FakeLlm implements LlmPort {
  private objectQueue: unknown[] = [];
  private textQueue: string[] = [];

  objectCalls = 0;
  textCalls = 0;

  /** Enqueue the next object(s) `generateObject` should return. */
  queueObject(...objects: unknown[]): this {
    this.objectQueue.push(...objects);
    return this;
  }

  /** Enqueue the next string(s) `generateText` should return. */
  queueText(...texts: string[]): this {
    this.textQueue.push(...texts);
    return this;
  }

  async generateObject<T>(args: GenerateObjectArgs<T>): Promise<T> {
    this.objectCalls++;
    if (this.objectQueue.length === 0) {
      throw new Error(`FakeLlm: no queued object for ${args.schemaName}`);
    }
    const next = this.objectQueue.shift();
    // Validate against the real schema so tests catch shape mismatches.
    return args.schema.parse(next);
  }

  async generateText(_args: GenerateTextArgs): Promise<string> {
    this.textCalls++;
    if (this.textQueue.length === 0) {
      throw new Error("FakeLlm: no queued text response");
    }
    return this.textQueue.shift()!;
  }
}
