import { describe, expect, it } from "vitest";
import { sanitizeSvg, SvgValidationError } from "./sanitize";
import { measurePathLength } from "./measure";
import { ingestIllustration } from "./ingest";

const GOOD_SVG = `<svg viewBox="0 0 100 100">
  <path d="M0 0 L100 0" stroke="#111111" stroke-width="8" fill="none" />
  <path d="M0 0 L0 100" stroke="#F97316" />
</svg>`;

describe("sanitizeSvg", () => {
  it("accepts a clean flat-path svg and normalizes attributes", async () => {
    const out = await sanitizeSvg(GOOD_SVG);
    expect(out.viewBox).toEqual({ minX: 0, minY: 0, width: 100, height: 100 });
    expect(out.paths).toHaveLength(2);
    expect(out.paths[0]!.stroke).toBe("#111111");
    expect(out.paths[0]!.fill).toBeNull();
    expect(out.paths[1]!.stroke).toBe("#f97316");
  });

  it("rejects scripts", async () => {
    const svg = `<svg viewBox="0 0 10 10"><script>alert(1)</script><path d="M0 0 L1 1"/></svg>`;
    await expect(sanitizeSvg(svg)).rejects.toBeInstanceOf(SvgValidationError);
  });

  it("converts basic shapes (rect/circle/line) to paths", async () => {
    const svg = `<svg viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="12" r="5" />
      <line x1="0" y1="0" x2="10" y2="10" />
    </svg>`;
    const out = await sanitizeSvg(svg);
    expect(out.paths).toHaveLength(3);
    expect(out.paths.every((p) => p.d.length > 0)).toBe(true);
  });

  it("still rejects genuinely disallowed elements (text/image)", async () => {
    const svg = `<svg viewBox="0 0 10 10"><text x="0" y="5">hi</text></svg>`;
    await expect(sanitizeSvg(svg)).rejects.toThrow(/Disallowed element/);
  });

  it("rejects element transforms (would desync path lengths)", async () => {
    const svg = `<svg viewBox="0 0 10 10"><path d="M0 0 L1 1" transform="scale(2)"/></svg>`;
    await expect(sanitizeSvg(svg)).rejects.toThrow(/transform/i);
  });

  it("rejects event handlers and external refs", async () => {
    await expect(
      sanitizeSvg(`<svg viewBox="0 0 10 10"><path d="M0 0 L1 1" onclick="x()"/></svg>`),
    ).rejects.toThrow(/Event handler/);
    await expect(
      sanitizeSvg(`<svg viewBox="0 0 10 10"><path d="M0 0 L1 1" href="http://x"/></svg>`),
    ).rejects.toThrow(/href/);
  });

  it("requires a viewBox and at least one path", async () => {
    await expect(sanitizeSvg(`<svg><path d="M0 0 L1 1"/></svg>`)).rejects.toThrow(/viewBox/);
    await expect(sanitizeSvg(`<svg viewBox="0 0 10 10"></svg>`)).rejects.toThrow(/no drawable/);
  });
});

describe("measurePathLength", () => {
  it("measures a straight line exactly", () => {
    expect(measurePathLength("M0 0 L3 4")).toBeCloseTo(5, 4);
  });

  it("returns 0 for a degenerate path rather than throwing", () => {
    expect(measurePathLength("M100 100 Q100 100 100 100")).toBe(0);
  });
});

describe("ingestIllustration", () => {
  it("produces a valid Illustration with precomputed lengths and draw order", async () => {
    const ill = await ingestIllustration(GOOD_SVG, { name: "cross", accentColor: "#f97316" });
    expect(ill.paths).toHaveLength(2);
    expect(ill.paths[0]!.order).toBe(0);
    expect(ill.paths[1]!.order).toBe(1);
    expect(ill.paths[0]!.length).toBeCloseTo(100, 4);
    expect(ill.accentColor).toBe("#f97316");
    // Missing stroke-width fell through to the schema default.
    expect(ill.paths[1]!.strokeWidth).toBe(8);
  });

  it("drops degenerate zero-length paths and renumbers order", async () => {
    const svg = `<svg viewBox="0 0 100 100">
      <path d="M100 100 Q100 100 100 100" stroke="#111111" />
      <path d="M0 0 L100 0" stroke="#111111" />
    </svg>`;
    const ill = await ingestIllustration(svg, { name: "one real stroke" });
    expect(ill.paths).toHaveLength(1);
    expect(ill.paths[0]!.order).toBe(0);
    expect(ill.paths[0]!.length).toBeCloseTo(100, 4);
  });

  it("rejects an illustration whose paths are all degenerate", async () => {
    const svg = `<svg viewBox="0 0 10 10"><path d="M5 5 L5 5" stroke="#111111"/></svg>`;
    await expect(ingestIllustration(svg, { name: "empty" })).rejects.toThrow(/no drawable paths/);
  });
});
