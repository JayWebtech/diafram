import "server-only";
import { createLlmPort, type LlmEnv, type LlmPort } from "@diafram/ai";

/**
 * Build the configured LLM port from server environment variables. Server-only:
 * this must never be imported into a client component (it reads API keys).
 */
export function getLlmPort(): LlmPort {
  const env: LlmEnv = {
    PLATFORM: process.env.PLATFORM,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  };
  return createLlmPort(env);
}
