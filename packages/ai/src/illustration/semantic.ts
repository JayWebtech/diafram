import type { Embedder } from "./embedder";
import type { RankedCandidate, Retriever, RetrieverFactory } from "./retrieve";

/**
 * Semantic retrieval: rank library entries by embedding similarity to the brief.
 *
 * Handles paraphrase and synonymy that the lexical scorer misses ("a group of
 * colleagues" → users, "records that can't be altered" → lock/shield). Corpus
 * vectors are computed once at build; each query embeds once and cosine-ranks.
 * Vectors are L2-normalized, so cosine similarity is a dot product.
 */
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i]! * b[i]!;
  return sum;
}

class SemanticRetriever implements Retriever {
  readonly threshold: number;

  constructor(
    private readonly docVectors: number[][],
    private readonly embedder: Embedder,
    threshold: number,
  ) {
    this.threshold = threshold;
  }

  async rank(query: string): Promise<RankedCandidate[]> {
    const [queryVector] = await this.embedder.embed([query]);
    if (!queryVector) return [];
    return this.docVectors
      .map((vector, index) => ({ index, score: dot(queryVector, vector) }))
      .sort((a, b) => b.score - a.score);
  }
}

export class SemanticRetrieverFactory implements RetrieverFactory {
  constructor(
    private readonly embedder: Embedder,
    /** Cosine cutoff — MiniLM similarity of ~0.4 is a reasonable "relevant" bar. */
    private readonly threshold = 0.4,
  ) {}

  async build(docs: string[]): Promise<Retriever> {
    const docVectors = await this.embedder.embed(docs);
    return new SemanticRetriever(docVectors, this.embedder, this.threshold);
  }
}
