/**
 * Text embedding for semantic retrieval.
 *
 * The default implementation runs a small sentence-transformer locally via
 * `@xenova/transformers` (ONNX) — no API, no per-call cost, offline after the
 * first model download. The `Embedder` seam lets a hosted embedder (Voyage,
 * OpenAI) drop in without touching retrieval.
 */
export interface Embedder {
  /** Return one L2-normalized vector per input text. */
  embed(texts: string[]): Promise<number[][]>;
}

export interface TransformersEmbedderOptions {
  /** Sentence-transformer model id. Defaults to a small, fast MiniLM. */
  model?: string;
}

const DEFAULT_MODEL = "Xenova/all-MiniLM-L6-v2";

/**
 * Lazily loads a transformers.js feature-extraction pipeline. The model is
 * fetched (and cached) on first `embed`, so constructing this is cheap; a load
 * failure surfaces there and lets callers fall back to lexical retrieval.
 */
export function createTransformersEmbedder(options: TransformersEmbedderOptions = {}): Embedder {
  const model = options.model ?? DEFAULT_MODEL;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extractor: any = null;

  return {
    async embed(texts: string[]): Promise<number[][]> {
      if (!extractor) {
        // webpackIgnore keeps the native embedding stack out of bundles (Next);
        // it's resolved from node_modules at runtime on the server only.
        const { pipeline } = await import(
          /* webpackIgnore: true */ "@xenova/transformers"
        );
        extractor = await pipeline("feature-extraction", model, { quantized: true });
      }
      const output = await extractor(texts, { pooling: "mean", normalize: true });
      return output.tolist() as number[][];
    },
  };
}
