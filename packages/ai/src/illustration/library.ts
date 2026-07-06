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
import { LexicalRetrieverFactory, type Retriever, type RetrieverFactory } from "./retrieve";
import type { IllustrationRequest, IllustrationSource } from "./source";
import type { LibraryEntry } from "./starter-pack";

/**
 * Retrieval-based illustration source over a curated icon library.
 *
 * Each entry is ingested and normalized ONCE at build time (uniform stroke, ink
 * color, draw order). A `RetrieverFactory` indexes the entries (lexical by
 * default, semantic when provided) and ranks briefs at resolve time. Below the
 * retriever's threshold it returns `null` so the chain falls through to
 * generation.
 */
interface BuiltEntry {
  illustration: Illustration;
  accentPathIds: Set<string>;
}

export interface LibraryOptions {
  retrieverFactory?: RetrieverFactory;
  style?: NormalizeStyle;
  /** Accept cutoff override (defaults to the retriever's own threshold). */
  threshold?: number;
}

export class LibraryIllustrationSource implements IllustrationSource {
  constructor(
    private readonly entries: BuiltEntry[],
    private readonly retriever: Retriever,
    private readonly threshold: number,
  ) {}

  async resolve(request: IllustrationRequest): Promise<Illustration | null> {
    const ranked = await this.retriever.rank(request.brief);
    const top = ranked[0];
    if (!top || top.score < this.threshold) return null;

    const entry = this.entries[top.index]!;
    const accented = withAccent(entry.illustration, request.accentColor ?? null, entry.accentPathIds);
    // Fresh id + brief-derived name so each placement is distinct and labeled.
    return { ...accented, id: newIllustrationId(), name: request.brief, promptHash: null };
  }
}

/** The text a retriever indexes for an entry: its name plus keyword tags. */
function entryText(entry: LibraryEntry): string {
  return [entry.name, ...entry.keywords].join(" ");
}

/** Ingest + normalize a pack once and return a ready retrieval source. */
export async function createLibraryIllustrationSource(
  pack: LibraryEntry[],
  options: LibraryOptions = {},
): Promise<LibraryIllustrationSource> {
  const style = options.style ?? DEFAULT_STYLE;
  const factory = options.retrieverFactory ?? new LexicalRetrieverFactory();

  // Build each entry, skipping any icon that fails ingestion (important when
  // importing a whole pack). Entries and retrieval docs stay index-aligned.
  const results = await Promise.all(
    pack.map(async (entry): Promise<{ built: BuiltEntry; doc: string } | null> => {
      try {
        const raw = await ingestIllustration(entry.svg, { name: entry.name });
        const accentPathIds = new Set(
          (entry.accentPathIndexes ?? [])
            .map((i) => raw.paths[i]?.id)
            .filter((id): id is (typeof raw.paths)[number]["id"] => Boolean(id)),
        );
        const normalized = normalizeIllustration(withInk(raw, DEFAULT_STROKE_COLOR), style);
        return { built: { illustration: normalized, accentPathIds }, doc: entryText(entry) };
      } catch {
        return null;
      }
    }),
  );

  const entries: BuiltEntry[] = [];
  const docs: string[] = [];
  for (const result of results) {
    if (!result) continue;
    entries.push(result.built);
    docs.push(result.doc);
  }

  const retriever = await factory.build(docs);
  const threshold = options.threshold ?? retriever.threshold;

  return new LibraryIllustrationSource(entries, retriever, threshold);
}
