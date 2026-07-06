import type { LlmPort } from "../llm/port";
import { createTransformersEmbedder } from "./embedder";
import { createLibraryIllustrationSource } from "./library";
import { loadAllLucide } from "./packs/lucide";
import { PeopleIllustrationSource } from "./packs/people";
import { LexicalRetrieverFactory } from "./retrieve";
import { SemanticRetrieverFactory } from "./semantic";
import {
  ChainedIllustrationSource,
  LlmIllustrationSource,
  type IllustrationSource,
} from "./source";

/**
 * The default production art source: a large professional icon library first,
 * hand-drawn people for person briefs, and the LLM as the last-resort fallback.
 * All tiers share the same normalization, so output is style-consistent.
 *
 * The library imports the FULL Lucide set (~2,000 icons) for broad coverage, so
 * the weak LLM artist is rarely needed. Retrieval is semantic when the local
 * model loads, else lexical. The (expensive) library build is cached per process.
 */
let cachedLibrary: Promise<IllustrationSource> | null = null;

async function buildLibrary(): Promise<IllustrationSource> {
  const pack = loadAllLucide();

  // Semantic retrieval is opt-in (`DIAFRAM_EMBEDDINGS=on`): the local embedding
  // stack has native deps (sharp/onnxruntime) that aren't built in every
  // environment. Lexical retrieval is the robust default.
  if (process.env.DIAFRAM_EMBEDDINGS === "on") {
    try {
      const embedder = createTransformersEmbedder();
      return await createLibraryIllustrationSource(pack, {
        retrieverFactory: new SemanticRetrieverFactory(embedder),
      });
    } catch {
      // Embedding model unavailable — fall through to lexical.
    }
  }

  return createLibraryIllustrationSource(pack, {
    retrieverFactory: new LexicalRetrieverFactory(),
  });
}

export async function createDefaultIllustrationSource(llm: LlmPort): Promise<IllustrationSource> {
  // Cache the (expensive) library build, but don't persist a failure — reset on
  // reject so a transient error doesn't poison the process.
  if (!cachedLibrary) {
    cachedLibrary = buildLibrary().catch((err) => {
      cachedLibrary = null;
      throw err;
    });
  }
  const library = await cachedLibrary;
  return new ChainedIllustrationSource([
    new PeopleIllustrationSource(),
    library,
    new LlmIllustrationSource(llm),
  ]);
}
