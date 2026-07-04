import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import type {
  GenerateObjectArgs,
  GenerateTextArgs,
  LlmPort,
} from "./port";
import { LlmValidationError } from "./port";

/**
 * Anthropic (Claude)-backed LLM port.
 *
 * Claude has no OpenAI-style JSON mode, so `generateObject` prompts for a bare
 * JSON object and enforces the schema ourselves — zod validation plus a bounded
 * repair loop — mirroring the DeepSeek port so the two are interchangeable.
 *
 * Note: Opus 4.7/4.8 reject `temperature`/`top_p`/`top_k` (HTTP 400), so the
 * port's `temperature` hint is deliberately ignored here.
 */
export interface ClaudeConfig {
  apiKey: string;
  /** Defaults to "claude-opus-4-8". Set ANTHROPIC_MODEL to override (e.g. a cheaper tier). */
  model?: string;
  maxObjectAttempts?: number;
  maxTokens?: number;
}

const DEFAULT_MODEL = "claude-opus-4-8";
const DEFAULT_MAX_TOKENS = 16000;

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/** Trim surrounding prose/code fences to the outermost JSON object. */
function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  return start !== -1 && end !== -1 && end > start ? raw.slice(start, end + 1) : raw.trim();
}

export function createClaudePort(config: ClaudeConfig): LlmPort {
  const client = new Anthropic({ apiKey: config.apiKey });
  const model = config.model ?? DEFAULT_MODEL;
  const maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
  const maxAttempts = config.maxObjectAttempts ?? 3;

  return {
    async generateObject<T>(args: GenerateObjectArgs<T>): Promise<T> {
      const jsonSchema = zodToJsonSchema(args.schema, args.schemaName);
      const baseSystem = [
        args.system,
        "Respond with ONLY a single JSON object — no markdown, no code fences, no prose.",
        "It MUST conform to this JSON Schema:",
        JSON.stringify(jsonSchema),
      ].join("\n\n");

      let lastError = "";
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const system =
          attempt === 1
            ? baseSystem
            : `${baseSystem}\n\nYour previous answer was invalid: ${lastError}\nReturn corrected JSON.`;

        const message = await client.messages.create({
          model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: args.prompt }],
        });

        if (message.stop_reason === "refusal") {
          throw new LlmValidationError(`Claude refused to produce ${args.schemaName}`, attempt);
        }

        try {
          const parsed = JSON.parse(extractJson(extractText(message))) as unknown;
          return args.schema.parse(parsed);
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }

      throw new LlmValidationError(
        `Claude could not produce valid ${args.schemaName}: ${lastError}`,
        maxAttempts,
      );
    },

    async generateText(args: GenerateTextArgs): Promise<string> {
      const message = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: args.system,
        messages: [{ role: "user", content: args.prompt }],
      });
      if (message.stop_reason === "refusal") {
        throw new Error("Claude refused to generate the requested content");
      }
      return extractText(message);
    },
  };
}
