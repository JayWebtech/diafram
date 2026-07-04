import {
  newIllustrationId,
  newPathId,
  zIllustration,
  type Illustration,
} from "@diafram/schema";
import { sanitizeSvg, SvgValidationError } from "./sanitize";
import { measurePathLength } from "./measure";

/** Paths shorter than this (user units) are invisible; we drop them at ingestion. */
const MIN_PATH_LENGTH = 0.5;

/**
 * Ingest a raw SVG string into a render-ready `Illustration`.
 *
 * This is the bridge from "untrusted model output" to "validated contract
 * object": sanitize → measure every path → assign ids and draw order → validate
 * against the schema. Pure and deterministic given its inputs, so it is fully
 * unit-testable without the network.
 */
export interface IngestOptions {
  name: string;
  accentColor?: string | null;
  styleVersion?: number;
  promptHash?: string | null;
}

export async function ingestIllustration(
  svg: string,
  options: IngestOptions,
): Promise<Illustration> {
  const sanitized = await sanitizeSvg(svg);

  // Measure, then drop degenerate (zero-length) paths — a common artifact of
  // model output. Re-number draw order over the survivors so it stays contiguous.
  const drawable = sanitized.paths
    .map((path) => ({ path, length: measurePathLength(path.d) }))
    .filter((entry) => entry.length >= MIN_PATH_LENGTH);

  if (drawable.length === 0) {
    throw new SvgValidationError("SVG has no drawable paths (all are zero-length)");
  }

  const paths = drawable.map(({ path, length }, order) => ({
    id: newPathId(),
    d: path.d,
    order,
    length,
    // Undefined stroke/strokeWidth fall through to schema defaults.
    ...(path.stroke ? { stroke: path.stroke } : {}),
    ...(path.strokeWidth ? { strokeWidth: path.strokeWidth } : {}),
    fill: path.fill ?? null,
  }));

  // zIllustration.parse applies defaults (stroke color/width) and brands ids.
  return zIllustration.parse({
    id: newIllustrationId(),
    name: options.name,
    viewBox: sanitized.viewBox,
    paths,
    accentColor: options.accentColor ?? null,
    promptHash: options.promptHash ?? null,
    styleVersion: options.styleVersion ?? 1,
  });
}
