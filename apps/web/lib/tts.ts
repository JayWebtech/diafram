import "server-only";
import { createTtsPort, type TtsEnv, type TtsPort } from "@diafram/ai";

/**
 * Build the configured TTS port from server environment variables. Server-only.
 */
export function getTtsPort(): TtsPort | null {
  const env: TtsEnv = {
    TTS_PROVIDER: process.env.TTS_PROVIDER,
    TTS_VOICE: process.env.TTS_VOICE,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };
  return createTtsPort(env);
}
