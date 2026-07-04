import type { Illustration } from "@diafram/schema";
import type { LlmPort } from "../llm/port";
import { generateIllustration } from "../agents/artist";
import { DEFAULT_STYLE, normalizeIllustration, type NormalizeStyle } from "./normalize";

/**
 * The illustration source seam.
 *
 * Anything that can turn a brief into an `Illustration` implements this. The
 * pipeline depends only on this interface, so the art *source* (curated library,
 * vector generation, LLM SVG, a vision-gated combination) can change without
 * touching the renderer, engine, timeline, editor, or export.
 *
 * `resolve` returns `null` when the source can't satisfy the brief, so sources
 * chain: library first, generation as fallback.
 */
export interface IllustrationRequest {
  brief: string;
  accentColor?: string | null;
}

export interface IllustrationSource {
  resolve(request: IllustrationRequest): Promise<Illustration | null>;
}

/** Try each source in order; return the first that produces an illustration. */
export class ChainedIllustrationSource implements IllustrationSource {
  constructor(private readonly sources: IllustrationSource[]) {}

  async resolve(request: IllustrationRequest): Promise<Illustration | null> {
    for (const source of this.sources) {
      const result = await source.resolve(request);
      if (result) return result;
    }
    return null;
  }
}

/**
 * The last-resort source: the LLM SVG artist. Its output is run through the same
 * normalization pass as the library so generated art matches the house style.
 * Never returns `null` — it throws if it can't produce valid art after retries.
 */
export class LlmIllustrationSource implements IllustrationSource {
  constructor(
    private readonly llm: LlmPort,
    private readonly style: NormalizeStyle = DEFAULT_STYLE,
  ) {}

  async resolve(request: IllustrationRequest): Promise<Illustration | null> {
    const illustration = await generateIllustration(this.llm, {
      brief: request.brief,
      accentColor: request.accentColor ?? null,
    });
    return normalizeIllustration(illustration, this.style);
  }
}
