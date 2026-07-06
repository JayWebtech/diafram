import { SayTtsProvider } from "./say";
import type { TtsPort } from "./port";

/**
 * Select a TTS provider from the environment. Returns `null` when no provider is
 * available/configured (voice is optional — the pipeline simply skips it).
 *
 * Defaults to the local `say` provider on macOS; ElevenLabs/OpenAI adapters
 * slot in here when their keys are present.
 */
export interface TtsEnv {
  /** `say` | `none` | (future) `elevenlabs` | `openai`. */
  TTS_PROVIDER?: string;
  TTS_VOICE?: string;
  ELEVENLABS_API_KEY?: string;
  OPENAI_API_KEY?: string;
}

export function createTtsPort(env: TtsEnv): TtsPort | null {
  const provider = env.TTS_PROVIDER?.toLowerCase();

  if (provider === "none") return null;
  if (provider === "say" || (!provider && process.platform === "darwin")) {
    return new SayTtsProvider(env.TTS_VOICE ?? "Samantha");
  }

  // Production adapters (need keys) land here:
  // if (env.ELEVENLABS_API_KEY) return new ElevenLabsTtsProvider(...);
  // if (env.OPENAI_API_KEY) return new OpenAiTtsProvider(...);
  return null;
}
