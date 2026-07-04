import type { LlmPort } from "../llm/port";
import { createLibraryIllustrationSource } from "./library";
import { CURATED_LUCIDE, loadLucidePack } from "./packs/lucide";
import { ChainedIllustrationSource, LlmIllustrationSource, type IllustrationSource } from "./source";
import { STARTER_PACK } from "./starter-pack";

/**
 * The default production art source: a professional icon library first, LLM
 * generation as the fallback for briefs the library doesn't cover. Both tiers
 * share the same normalization, so output is style-consistent regardless of
 * origin.
 *
 * The library imports the Lucide pack (ISC, ~1,500 consistent line icons) if it
 * resolves; the hand-authored starter icons are folded in as a small supplement.
 * (Tier-2 vector generation and a vision QA gate slot into this chain later.)
 */
export async function createDefaultIllustrationSource(llm: LlmPort): Promise<IllustrationSource> {
  const lucide = loadLucidePack(CURATED_LUCIDE);
  const pack = [...lucide, ...STARTER_PACK];

  const library = await createLibraryIllustrationSource(pack);
  return new ChainedIllustrationSource([library, new LlmIllustrationSource(llm)]);
}
