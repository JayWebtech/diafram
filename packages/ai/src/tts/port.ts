/**
 * The text-to-speech port.
 *
 * Narration is generated through this narrow interface so the pipeline is
 * provider-agnostic: a local macOS `say` provider for dev (no key, verifiable),
 * and ElevenLabs/OpenAI adapters for production quality behind the same shape.
 */
export interface TtsRequest {
  text: string;
  /** Provider-specific voice id/name; falls back to the provider default. */
  voice?: string;
}

export interface SynthesizedAudio {
  /** Playable audio as a base64 data URI (works in the Player and headless render). */
  dataUri: string;
  durationSeconds: number;
}

export interface TtsPort {
  synthesize(request: TtsRequest): Promise<SynthesizedAudio>;
}
