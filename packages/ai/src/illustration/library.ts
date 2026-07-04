import {
  DEFAULT_STROKE_COLOR,
  newIllustrationId,
  type Illustration,
} from "@diafram/schema";
import { ingestIllustration } from "../svg/ingest";
import {
  DEFAULT_STYLE,
  normalizeIllustration,
  withAccent,
  withInk,
  type NormalizeStyle,
} from "./normalize";
import { LexicalRetriever, tokenize, type Retriever } from "./retrieve";
import type { IllustrationRequest, IllustrationSource } from "./source";
import type { LibraryEntry } from "./starter-pack";

/**
 * Retrieval-based illustration source over a curated icon library.
 *
 * Each entry is ingested and normalized ONCE at build time (uniform stroke, ink
 * color, draw order). At resolve time it ranks the brief against the library and
 * returns a clean, style-consistent icon — no drawing, no coordinate guessing.
 * Below the confidence threshold it returns `null` so the chain falls through to
 * generation.
 */
interface BuiltEntry {
  tokens: string[];
  illustration: Illustration;
  accentPathIds: Set<string>;
}

export interface LibraryOptions {
  retriever?: Retriever;
  style?: NormalizeStyle;
  /** Minimum fraction of brief tokens that must match to accept a library hit. */
  threshold?: number;
}

export class LibraryIllustrationSource implements IllustrationSource {
  constructor(
    private readonly entries: BuiltEntry[],
    private readonly retriever: Retriever,
    private readonly threshold: number,
  ) {}

  async resolve(request: IllustrationRequest): Promise<Illustration | null> {
    const ranked = this.retriever.rank(
      request.brief,
      this.entries.map((e) => e.tokens),
    );
    const top = ranked[0];
    if (!top || top.score < this.threshold) return null;

    const entry = this.entries[top.index]!;
    const accented = withAccent(entry.illustration, request.accentColor ?? null, entry.accentPathIds);
    // Fresh id + brief-derived name so each placement is distinct and labeled.
    return { ...accented, id: newIllustrationId(), name: request.brief, promptHash: null };
  }
}

/** Ingest + normalize a pack once and return a ready retrieval source. */
export async function createLibraryIllustrationSource(
  pack: LibraryEntry[],
  options: LibraryOptions = {},
): Promise<LibraryIllustrationSource> {
  const style = options.style ?? DEFAULT_STYLE;
  const retriever = options.retriever ?? new LexicalRetriever();
  const threshold = options.threshold ?? 0.5;

  const entries = await Promise.all(
    pack.map(async (entry): Promise<BuiltEntry> => {
      const raw = await ingestIllustration(entry.svg, { name: entry.name });
      // Accent path ids captured in document order, before reordering.
      const accentPathIds = new Set(
        (entry.accentPathIndexes ?? [])
          .map((i) => raw.paths[i]?.id)
          .filter((id): id is (typeof raw.paths)[number]["id"] => Boolean(id)),
      );
      const normalized = normalizeIllustration(withInk(raw, DEFAULT_STROKE_COLOR), style);
      return { tokens: tokenize(entry.name, entry.keywords), illustration: normalized, accentPathIds };
    }),
  );

  return new LibraryIllustrationSource(entries, retriever, threshold);
}
