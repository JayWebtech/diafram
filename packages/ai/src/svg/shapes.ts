import type { INode } from "svgson";

/**
 * Convert basic SVG shape elements into path `d` strings.
 *
 * Professional icon packs (Lucide, Iconoir, Tabler…) are drawn with a mix of
 * `<circle>`, `<rect>`, `<line>`, `<polyline>`, `<polygon>`, and `<ellipse>` —
 * not just `<path>`. To ingest them (and to let the LLM use these primitives),
 * we losslessly convert each shape to an equivalent path, which the renderer's
 * stroke-dash draw-on then handles uniformly.
 */
export const CONVERTIBLE_SHAPES = new Set([
  "line",
  "rect",
  "circle",
  "ellipse",
  "polyline",
  "polygon",
]);

function num(node: INode, name: string, fallback = 0): number {
  const raw = node.attributes[name];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePoints(raw: string | undefined): Array<[number, number]> {
  if (!raw) return [];
  const nums = raw.match(/-?\d*\.?\d+(?:e-?\d+)?/gi)?.map(Number) ?? [];
  const points: Array<[number, number]> = [];
  for (let i = 0; i + 1 < nums.length; i += 2) points.push([nums[i]!, nums[i + 1]!]);
  return points;
}

/** Path data for an axis-aligned rectangle, with optional corner radii. */
function rectPath(x: number, y: number, w: number, h: number, rxIn: number, ryIn: number): string {
  const rx = Math.min(rxIn, w / 2);
  const ry = Math.min(ryIn, h / 2);
  if (rx <= 0 || ry <= 0) {
    return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
  }
  return [
    `M ${x + rx} ${y}`,
    `H ${x + w - rx}`,
    `A ${rx} ${ry} 0 0 1 ${x + w} ${y + ry}`,
    `V ${y + h - ry}`,
    `A ${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}`,
    `H ${x + rx}`,
    `A ${rx} ${ry} 0 0 1 ${x} ${y + h - ry}`,
    `V ${y + ry}`,
    `A ${rx} ${ry} 0 0 1 ${x + rx} ${y}`,
    "Z",
  ].join(" ");
}

/** Path data for a full ellipse (two half-arcs). */
function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
}

/** Returns the path `d` for a convertible shape, or `null` if it's degenerate. */
export function shapeToPathD(node: INode): string | null {
  switch (node.name) {
    case "line":
      return `M ${num(node, "x1")} ${num(node, "y1")} L ${num(node, "x2")} ${num(node, "y2")}`;

    case "rect": {
      const w = num(node, "width");
      const h = num(node, "height");
      if (w <= 0 || h <= 0) return null;
      const rx = node.attributes.rx !== undefined ? num(node, "rx") : num(node, "ry");
      const ry = node.attributes.ry !== undefined ? num(node, "ry") : num(node, "rx");
      return rectPath(num(node, "x"), num(node, "y"), w, h, rx, ry);
    }

    case "circle": {
      const r = num(node, "r");
      if (r <= 0) return null;
      return ellipsePath(num(node, "cx"), num(node, "cy"), r, r);
    }

    case "ellipse": {
      const rx = num(node, "rx");
      const ry = num(node, "ry");
      if (rx <= 0 || ry <= 0) return null;
      return ellipsePath(num(node, "cx"), num(node, "cy"), rx, ry);
    }

    case "polyline":
    case "polygon": {
      const points = parsePoints(node.attributes.points);
      if (points.length < 2) return null;
      const [first, ...rest] = points;
      const d = `M ${first![0]} ${first![1]} ${rest.map(([x, y]) => `L ${x} ${y}`).join(" ")}`;
      return node.name === "polygon" ? `${d} Z` : d;
    }

    default:
      return null;
  }
}
