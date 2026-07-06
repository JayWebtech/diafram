import type { Storyboard } from "@diafram/schema";
import type { TtsPort } from "./port";

/**
 * Synthesized narration for one scene: playable audio + its length (so the
 * structuring compiler can make the scene at least as long as its narration).
 */
export interface SceneNarration {
  audioDataUri: string;
  durationSeconds: number;
}

/**
 * Generate narration audio for each storyboard scene (aligned to scene order).
 * Scenes with empty narration yield `null`. Sequential to bound resource use.
 */
export async function synthesizeNarration(
  tts: TtsPort,
  storyboard: Storyboard,
): Promise<Array<SceneNarration | null>> {
  const results: Array<SceneNarration | null> = [];
  for (const scene of storyboard.scenes) {
    const text = scene.narration?.trim();
    if (!text) {
      results.push(null);
      continue;
    }
    const audio = await tts.synthesize({ text });
    results.push({ audioDataUri: audio.dataUri, durationSeconds: audio.durationSeconds });
  }
  return results;
}
