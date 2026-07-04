import { createHash } from "node:crypto";

/**
 * Content addressing for the illustration reuse library.
 *
 * Two illustration briefs that mean the same thing (modulo whitespace/case)
 * under the same style + accent should hash to the same key, so a "closed
 * padlock" is drawn once and reused everywhere. This is the main cost lever in
 * the pipeline and, over time, a compounding asset.
 */

/** The style-guide version; bump to invalidate the whole reuse cache. */
export const STYLE_VERSION = 1;

/** Normalize a brief so trivially different phrasings collapse together. */
export function normalizeBrief(brief: string): string {
  return brief
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Stable content hash for a brief under a given accent color and style version. */
export function illustrationHash(brief: string, accentColor: string | null): string {
  const key = `${STYLE_VERSION}|${accentColor ?? "none"}|${normalizeBrief(brief)}`;
  return createHash("sha256").update(key).digest("hex");
}
