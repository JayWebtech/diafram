import OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import type {
  GenerateObjectArgs,
  GenerateTextArgs,
  LlmPort,
} from "./port";
import { LlmValidationError } from "./port";

/**
 * DeepSeek-backed LLM port.
 *
 * DeepSeek exposes an OpenAI-compatible chat API, so we drive it with the
 * official `openai` client pointed at DeepSeek's base URL. DeepSeek does not do
 * strict schema-guided decoding, so `generateObject` uses JSON mode and enforces
 * the schema ourselves — validating with zod and, on failure, re-prompting the
 * model with the validation error (a bounded repair loop).
 */
export interface DeepSeekConfig {
  apiKey: string;
  /** Defaults to "deepseek-chat" (DeepSeek-V3). */
  model?: string;
  baseURL?: string;
  /** Max attempts for `generateObject` before giving up. */
  maxObjectAttempts?: number;
}

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";

export function createDeepSeekPort(config: DeepSeekConfig): LlmPort {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL ?? DEFAULT_BASE_URL,
  });
  const model = config.model ?? DEFAULT_MODEL;
  const maxAttempts = config.maxObjectAttempts ?? 3;

  return {
    async generateObject<T>(args: GenerateObjectArgs<T>): Promise<T> {
      const jsonSchema = zodToJsonSchema(args.schema, args.schemaName);
      const baseSystem = [
        args.system,
        "Respond with a single JSON object and nothing else.",
        "It MUST conform to this JSON Schema:",
        JSON.stringify(jsonSchema),
      ].join("\n\n");

      let lastError = "";
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const system =
          attempt === 1
            ? baseSystem
            : `${baseSystem}\n\nYour previous answer was invalid: ${lastError}\nReturn corrected JSON.`;

        const completion = await client.chat.completions.create({
          model,
          temperature: args.temperature ?? 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: args.prompt },
          ],
        });

        const content = completion.choices[0]?.message?.content ?? "";
        try {
          const parsed = JSON.parse(content) as unknown;
          return args.schema.parse(parsed);
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }

      throw new LlmValidationError(
        `DeepSeek could not produce valid ${args.schemaName}: ${lastError}`,
        maxAttempts,
      );
    },

    async generateText(args: GenerateTextArgs): Promise<string> {
      const completion = await client.chat.completions.create({
        model,
        temperature: args.temperature ?? 0.7,
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.prompt },
        ],
      });
      return completion.choices[0]?.message?.content ?? "";
    },
  };
}
