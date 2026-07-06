import { parse, stringify, type INode } from "svgson";
import { SvgValidationError } from "./sanitize";

/**
 * Sanitize *trusted* filled SVG (e.g. a hand-drawn person from a vetted pack)
 * into inner markup rendered wholesale and revealed by a wipe.
 *
 * Unlike the line-art sanitizer this keeps groups, transforms, gradients, masks
 * and clip paths (filled artwork needs them) — it only strips scripts, styles,
 * event handlers, and external references, and namespaces internal ids so that
 * multiple illustrations on the same canvas can't collide.
 */
export interface SanitizedMarkup {
  viewBox: { minX: number; minY: number; width: number; height: number };
  markup: string;
}

const DANGEROUS_ELEMENTS = new Set(["script", "style", "foreignObject"]);

function stripNode(node: INode): void {
  node.children = node.children.filter(
    (child) => !(child.type === "element" && DANGEROUS_ELEMENTS.has(child.name)),
  );
  for (const child of node.children) {
    if (child.type !== "element") continue;
    for (const attr of Object.keys(child.attributes)) {
      const lower = attr.toLowerCase();
      const value = child.attributes[attr] ?? "";
      // Drop event handlers and external references (keep internal `#id` refs).
      if (lower.startsWith("on")) delete child.attributes[attr];
      else if ((lower === "href" || lower === "xlink:href") && !value.startsWith("#")) {
        delete child.attributes[attr];
      }
    }
    stripNode(child);
  }
}

function resolveViewBox(root: INode): SanitizedMarkup["viewBox"] {
  const raw = root.attributes.viewBox;
  if (raw) {
    const parts = raw.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      const [minX, minY, width, height] = parts as [number, number, number, number];
      if (width > 0 && height > 0) return { minX, minY, width, height };
    }
  }
  const width = Number(root.attributes.width);
  const height = Number(root.attributes.height);
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { minX: 0, minY: 0, width, height };
  }
  throw new SvgValidationError("Markup SVG is missing a usable viewBox / dimensions");
}

/** Prefix internal ids and their references so illustrations don't collide. */
function namespaceIds(markup: string, prefix: string): string {
  return markup
    .replace(/id="([^"]+)"/g, (_m, id: string) => `id="${prefix}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${prefix}${id})`)
    .replace(/((?:xlink:)?href)="#([^"]+)"/g, (_m, attr: string, id: string) => `${attr}="#${prefix}${id}"`);
}

export async function sanitizeMarkup(svg: string, idPrefix: string): Promise<SanitizedMarkup> {
  let root: INode;
  try {
    root = await parse(svg.trim());
  } catch (err) {
    throw new SvgValidationError(
      `Could not parse markup SVG: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (root.name !== "svg") {
    throw new SvgValidationError(`Markup root must be <svg>, got <${root.name}>`);
  }

  const viewBox = resolveViewBox(root);
  stripNode(root);
  const inner = root.children.map((child) => stringify(child)).join("");
  return { viewBox, markup: namespaceIds(inner, idPrefix) };
}
