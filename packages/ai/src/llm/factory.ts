import { createClaudePort } from "./anthropic";
import { createDeepSeekPort } from "./deepseek";
import type { LlmPort } from "./port";

/**
 * Provider selection.
 *
 * The active provider is chosen by the `PLATFORM` environment variable
 * (`deepseek` | `claude`), so switching models is a one-line `.env` change with
 * no code edits. Everything downstream depends only on `LlmPort`.
 */
export type Platform = "deepseek" | "claude";

export interface LlmEnv {
  PLATFORM?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
}

/** Normalize the `PLATFORM` value; defaults to deepseek. Throws on anything else. */
export function resolvePlatform(env: LlmEnv): Platform {
  const raw = (env.PLATFORM ?? "deepseek").toLowerCase();
  if (raw === "claude" || raw === "anthropic") return "claude";
  if (raw === "deepseek") return "deepseek";
  throw new Error(`Unknown PLATFORM "${env.PLATFORM}" (expected "deepseek" or "claude")`);
}

/** Build the configured LLM port from environment values. */
export function createLlmPort(env: LlmEnv): LlmPort {
  const platform = resolvePlatform(env);

  if (platform === "claude") {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error("PLATFORM=claude requires ANTHROPIC_API_KEY");
    }
    return createClaudePort({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL });
  }

  if (!env.DEEPSEEK_API_KEY) {
    throw new Error("PLATFORM=deepseek requires DEEPSEEK_API_KEY");
  }
  return createDeepSeekPort({ apiKey: env.DEEPSEEK_API_KEY, model: env.DEEPSEEK_MODEL });
}
