import type { Illustration } from "@diafram/schema";

/**
 * Style-normalization and stroke-ordering passes, applied to EVERY illustration
 * regardless of source (library or generated). Uniform stroke weight + a
 * consistent draw order is most of what separates "professional" from "AI slop"
 * — a retrieved icon and a generated one should look like one hand drew them.
 *
 * Pure functions on the validated `Illustration` shape (geometry is untouched;
 * only stroke width, ink color, fill, draw order, and accent change).
 */
export type OrderStrategy = "lengthDesc" | "documentOrder";

export interface NormalizeStyle {
  /** Stroke width as a fraction of the viewBox diagonal (visual consistency across viewBoxes). */
  strokeWidthRatio: number;
  orderStrategy: OrderStrategy;
}

export const DEFAULT_STYLE: NormalizeStyle = {
  strokeWidthRatio: 0.03,
  orderStrategy: "lengthDesc",
};

function diagonal(viewBox: Illustration["viewBox"]): number {
  return Math.sqrt(viewBox.width ** 2 + viewBox.height ** 2);
}

/** Give every stroke the same visual weight relative to the illustration's size. */
export function withUniformStroke(ill: Illustration, ratio: number): Illustration {
  const target = Math.max(1, Math.round(diagonal(ill.viewBox) * ratio));
  return { ...ill, paths: ill.paths.map((p) => ({ ...p, strokeWidth: target })) };
}

/** Force a single ink color and drop fills (line-art house style). */
export function withInk(ill: Illustration, color: string): Illustration {
  return {
    ...ill,
    accentColor: null,
    paths: ill.paths.map((p) => ({ ...p, stroke: color, fill: null })),
  };
}

/**
 * Reorder strokes for a natural draw-on. `lengthDesc` draws the big structural
 * shapes first and small details last — how a person sketches — and reassigns a
 * contiguous `order`.
 */
export function withDrawOrder(ill: Illustration, strategy: OrderStrategy): Illustration {
  const ordered = [...ill.paths];
  if (strategy === "lengthDesc") ordered.sort((a, b) => b.length - a.length);
  else ordered.sort((a, b) => a.order - b.order);
  return { ...ill, paths: ordered.map((p, i) => ({ ...p, order: i })) };
}

/** Recolor the given paths with the accent color. */
export function withAccent(
  ill: Illustration,
  accentColor: string | null,
  accentPathIds: Set<string>,
): Illustration {
  if (!accentColor) return ill;
  return {
    ...ill,
    accentColor,
    paths: ill.paths.map((p) => (accentPathIds.has(p.id) ? { ...p, stroke: accentColor } : p)),
  };
}

/** The standard pass: uniform stroke weight + natural draw order. */
export function normalizeIllustration(
  ill: Illustration,
  style: NormalizeStyle = DEFAULT_STYLE,
): Illustration {
  return withDrawOrder(withUniformStroke(ill, style.strokeWidthRatio), style.orderStrategy);
}
