import type { Illustration } from "@diafram/schema";

/**
 * The illustration reuse library.
 *
 * Keyed by the content hash of a brief (see `hash.ts`). The pipeline consults it
 * before generating artwork so identical briefs are only ever drawn once. This
 * is the port; a Postgres/R2-backed implementation lands with the DB layer.
 */
export interface IllustrationLibrary {
  get(hash: string): Promise<Illustration | null>;
  put(hash: string, illustration: Illustration): Promise<void>;
}

/** An in-memory library, for tests and single-process runs. */
export class InMemoryIllustrationLibrary implements IllustrationLibrary {
  private readonly store = new Map<string, Illustration>();

  async get(hash: string): Promise<Illustration | null> {
    return this.store.get(hash) ?? null;
  }

  async put(hash: string, illustration: Illustration): Promise<void> {
    this.store.set(hash, illustration);
  }
}
