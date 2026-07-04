import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { LlmEnv } from "../src/llm/factory";

/**
 * Load LLM configuration for the CLI scripts: real environment variables take
 * precedence, falling back to packages/ai/.env (gitignored). No dotenv dep.
 */
export function loadEnv(): LlmEnv {
  const fileEnv: Record<string, string> = {};
  try {
    const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && match[1]) fileEnv[match[1]] = (match[2] ?? "").trim();
    }
  } catch {
    // No .env file — rely on process.env only.
  }

  const pick = (key: string): string | undefined => process.env[key] ?? fileEnv[key];

  return {
    PLATFORM: pick("PLATFORM"),
    DEEPSEEK_API_KEY: pick("DEEPSEEK_API_KEY"),
    DEEPSEEK_MODEL: pick("DEEPSEEK_MODEL"),
    ANTHROPIC_API_KEY: pick("ANTHROPIC_API_KEY"),
    ANTHROPIC_MODEL: pick("ANTHROPIC_MODEL"),
  };
}
