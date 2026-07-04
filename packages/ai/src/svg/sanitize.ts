import { parse, type INode } from "svgson";
import { CONVERTIBLE_SHAPES, shapeToPathD } from "./shapes";

/**
 * SVG sanitizer + validator.
 *
 * Turns an untrusted SVG (from the LLM artist or an imported icon pack) into a
 * safe, normalized set of stroked paths, or throws with a specific reason that
 * the artist's repair loop can act on.
 *
 * Rules:
 *  - root must be `<svg>` with a `viewBox`
 *  - allowed: `<svg>`, `<g>`, `<path>`, `<title>`, `<desc>`, and basic shapes
 *    (`<line>`, `<rect>`, `<circle>`, `<ellipse>`, `<polyline>`, `<polygon>`),
 *    which are converted to paths — so real icon packs ingest cleanly
 *  - no `<script>`, `<image>`, `<use>`, `<foreignObject>`, `<text>`, event
 *    handlers, or external references (security)
 *  - no element-level `transform` (would desync from precomputed path lengths)
 */

const ALLOWED_ELEMENTS = new Set([
  "svg",
  "g",
  "path",
  "title",
  "desc",
  ...CONVERTIBLE_SHAPES,
]);

export class SvgValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SvgValidationError";
  }
}

export interface SanitizedPath {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string | null;
}

export interface SanitizedSvg {
  viewBox: { minX: number; minY: number; width: number; height: number };
  paths: SanitizedPath[];
}

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function parseViewBox(value: string | undefined): SanitizedSvg["viewBox"] {
  if (!value) throw new SvgValidationError("Root <svg> is missing a viewBox");
  const parts = value.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    throw new SvgValidationError(`Invalid viewBox: "${value}"`);
  }
  const [minX, minY, width, height] = parts as [number, number, number, number];
  if (width <= 0 || height <= 0) {
    throw new SvgValidationError(`viewBox width/height must be positive: "${value}"`);
  }
  return { minX, minY, width, height };
}

function normalizeStroke(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return HEX.test(raw.trim()) ? raw.trim().toLowerCase() : undefined;
}

function normalizeFill(raw: string | undefined): string | null | undefined {
  if (!raw || raw.trim() === "none" || raw.trim() === "transparent") return null;
  return HEX.test(raw.trim()) ? raw.trim().toLowerCase() : null;
}

function assertSafeAttributes(node: INode): void {
  for (const attr of Object.keys(node.attributes)) {
    const lower = attr.toLowerCase();
    if (lower.startsWith("on")) {
      throw new SvgValidationError(`Event handler attribute not allowed: ${attr}`);
    }
    if (lower === "href" || lower === "xlink:href") {
      throw new SvgValidationError("External references (href) are not allowed");
    }
    if (lower === "transform") {
      throw new SvgValidationError(
        `Element-level transform is not allowed (on <${node.name}>)`,
      );
    }
  }
}

function walk(node: INode, paths: SanitizedPath[]): void {
  if (node.type === "element") {
    if (!ALLOWED_ELEMENTS.has(node.name)) {
      throw new SvgValidationError(`Disallowed element: <${node.name}>`);
    }
    assertSafeAttributes(node);

    if (node.name === "path" || CONVERTIBLE_SHAPES.has(node.name)) {
      const d =
        node.name === "path" ? node.attributes.d?.trim() : shapeToPathD(node)?.trim();
      if (node.name === "path" && !d) {
        throw new SvgValidationError("Found a <path> with an empty d attribute");
      }
      // Degenerate shapes convert to null; skip them rather than fail.
      if (d) {
        const sw = node.attributes["stroke-width"];
        paths.push({
          d,
          stroke: normalizeStroke(node.attributes.stroke),
          strokeWidth: sw !== undefined ? Number(sw) : undefined,
          fill: normalizeFill(node.attributes.fill),
        });
      }
    }
  }
  for (const child of node.children) walk(child, paths);
}

/** Parse, validate and normalize an untrusted SVG string. */
export async function sanitizeSvg(svg: string): Promise<SanitizedSvg> {
  let root: INode;
  try {
    root = await parse(svg.trim());
  } catch (err) {
    throw new SvgValidationError(
      `Could not parse SVG: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (root.name !== "svg") {
    throw new SvgValidationError(`Root element must be <svg>, got <${root.name}>`);
  }

  const viewBox = parseViewBox(root.attributes.viewBox);
  const paths: SanitizedPath[] = [];
  walk(root, paths);

  if (paths.length === 0) {
    throw new SvgValidationError("SVG contains no drawable elements");
  }
  return { viewBox, paths };
}
