import { normalizeBrief } from "../hash";

/**
 * Retrieval: rank library entries against a brief.
 *
 * A `RetrieverFactory` indexes the corpus once (at library-build time) and
 * returns a `Retriever` that ranks briefs. Two implementations share this seam:
 * a lexical scorer (offline, zero-cost, the default/fallback) and a semantic
 * embedder (`semantic.ts`) — swapping them changes nothing above the library.
 */
export interface RankedCandidate {
  index: number;
  score: number;
}

export interface Retriever {
  /** Suggested accept cutoff for this retriever's score scale. */
  readonly threshold: number;
  /** Rank the indexed corpus against `query`, best first. */
  rank(query: string): Promise<RankedCandidate[]>;
}

export interface RetrieverFactory {
  /** Index the corpus (one text per entry) and return a ready retriever. */
  build(docs: string[]): Promise<Retriever>;
}

/** Common words that carry no icon meaning; dropped before lexical scoring. */
const STOPWORDS = new Set([
  "a", "an", "the", "of", "and", "to", "in", "with", "on", "for", "that", "this",
  "is", "are", "it", "its", "your", "you", "showing", "icon", "simple",
]);

const SALIENT_CAP = 2;

function salientTokens(text: string): string[] {
  return normalizeBrief(text)
    .split(" ")
    .filter((t) => t && !STOPWORDS.has(t));
}

/**
 * Scores an entry by how many of the brief's salient tokens its tags cover,
 * capped so a descriptive brief still matches on its head noun. Robust for
 * keyword-tagged icon sets.
 */
class LexicalRetriever implements Retriever {
  readonly threshold = 0.5;
  private readonly docTokens: Set<string>[];

  constructor(docs: string[]) {
    this.docTokens = docs.map((doc) => new Set(salientTokens(doc)));
  }

  async rank(query: string): Promise<RankedCandidate[]> {
    const unique = Array.from(new Set(salientTokens(query)));
    const denom = Math.min(Math.max(unique.length, 1), SALIENT_CAP);

    return this.docTokens
      .map((set, index) => {
        if (unique.length === 0) return { index, score: 0 };
        const matched = unique.filter((t) => set.has(t)).length;
        return { index, score: Math.min(1, matched / denom) };
      })
      .sort((a, b) => b.score - a.score);
  }
}

export class LexicalRetrieverFactory implements RetrieverFactory {
  async build(docs: string[]): Promise<Retriever> {
    return new LexicalRetriever(docs);
  }
}
