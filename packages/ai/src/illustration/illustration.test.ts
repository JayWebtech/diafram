import { makeIllustration } from "@diafram/schema/fixtures";
import { newPathId, zIllustration } from "@diafram/schema";
import { describe, expect, it } from "vitest";
import { LexicalRetriever, tokenize } from "./retrieve";
import { withAccent, withDrawOrder, withInk, withUniformStroke } from "./normalize";
import { createLibraryIllustrationSource } from "./library";
import { STARTER_PACK } from "./starter-pack";

const twoPath = () =>
  makeIllustration({
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    paths: [
      { id: newPathId(), d: "M0 0 L10 0", order: 0, length: 10, strokeWidth: 3, stroke: "#111111", fill: null },
      { id: newPathId(), d: "M0 0 L30 0", order: 1, length: 30, strokeWidth: 9, stroke: "#111111", fill: null },
    ],
  });

describe("normalization", () => {
  it("gives every stroke the same visual weight", () => {
    const out = withUniformStroke(twoPath(), 0.03);
    const widths = new Set(out.paths.map((p) => p.strokeWidth));
    expect(widths.size).toBe(1);
    // 0.03 * sqrt(100^2 + 100^2) ≈ 4.24 → 4
    expect(out.paths[0]!.strokeWidth).toBe(4);
  });

  it("draws the longest stroke first (lengthDesc)", () => {
    const out = withDrawOrder(twoPath(), "lengthDesc");
    expect(out.paths[0]!.length).toBe(30);
    expect(out.paths[0]!.order).toBe(0);
    expect(out.paths[1]!.order).toBe(1);
  });

  it("inks all strokes one color and drops fills", () => {
    const out = withInk(twoPath(), "#000000");
    expect(out.accentColor).toBeNull();
    expect(out.paths.every((p) => p.stroke === "#000000" && p.fill === null)).toBe(true);
  });

  it("applies accent only to the named paths", () => {
    const ill = twoPath();
    const accentId = ill.paths[1]!.id;
    const out = withAccent(ill, "#f97316", new Set([accentId]));
    expect(out.accentColor).toBe("#f97316");
    expect(out.paths.find((p) => p.id === accentId)!.stroke).toBe("#f97316");
    expect(out.paths.find((p) => p.id !== accentId)!.stroke).toBe("#111111");
  });
});

describe("lexical retrieval", () => {
  it("scores by fraction of brief tokens matched", () => {
    const docs = [tokenize("closed padlock", ["lock", "secure"]), tokenize("arrow", ["next"])];
    const ranked = new LexicalRetriever().rank("closed padlock", docs);
    expect(ranked[0]!.index).toBe(0);
    expect(ranked[0]!.score).toBeCloseTo(1, 5);
  });
});

describe("library illustration source", () => {
  it("resolves matching briefs to clean, valid icons", async () => {
    const source = await createLibraryIllustrationSource(STARTER_PACK);

    const lock = await source.resolve({ brief: "closed padlock", accentColor: "#f97316" });
    expect(lock).not.toBeNull();
    expect(zIllustration.safeParse(lock).success).toBe(true);
    expect(lock!.name).toBe("closed padlock");
    // Accent was applied to at least one path.
    expect(lock!.paths.some((p) => p.stroke === "#f97316")).toBe(true);
    // Uniform stroke weight across the icon.
    expect(new Set(lock!.paths.map((p) => p.strokeWidth)).size).toBe(1);

    const notebook = await source.resolve({ brief: "an open notebook" });
    expect(notebook?.name).toBe("an open notebook");
  });

  it("returns null for briefs outside the library", async () => {
    const source = await createLibraryIllustrationSource(STARTER_PACK);
    const miss = await source.resolve({ brief: "quantum flux capacitor" });
    expect(miss).toBeNull();
  });
});
