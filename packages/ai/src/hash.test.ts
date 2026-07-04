import { describe, expect, it } from "vitest";
import { illustrationHash, normalizeBrief } from "./hash";

describe("brief hashing", () => {
  it("normalizes trivial phrasing differences together", () => {
    expect(normalizeBrief("  Closed Padlock! ")).toBe("closed padlock");
    expect(normalizeBrief("closed  padlock")).toBe("closed padlock");
  });

  it("hashes equal briefs to the same key regardless of case/space", () => {
    expect(illustrationHash("Closed Padlock", null)).toBe(illustrationHash("closed  padlock", null));
  });

  it("distinguishes different accents and different briefs", () => {
    expect(illustrationHash("padlock", "#f97316")).not.toBe(illustrationHash("padlock", null));
    expect(illustrationHash("padlock", null)).not.toBe(illustrationHash("notebook", null));
  });
});
