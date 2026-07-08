import { describe, expect, it } from "vitest";
import { roughenFilterId, PAPER_SHADOW_ID } from "./ink";
import { hashString, roughenParams, strokeWidthMultiplier, STROKE_JITTER } from "./style";

describe("ink filter ids", () => {
  it("derives a stable, unique roughen id per illustration", () => {
    expect(roughenFilterId("ill_abc")).toBe("roughen-ill_abc");
    expect(roughenFilterId("ill_abc")).toBe(roughenFilterId("ill_abc"));
    expect(roughenFilterId("ill_abc")).not.toBe(roughenFilterId("ill_xyz"));
  });

  it("exposes a shared paper-shadow id", () => {
    expect(PAPER_SHADOW_ID).toBe("paper-shadow");
  });
});

describe("hashString", () => {
  it("is deterministic and in the 16-bit range", () => {
    expect(hashString("path_1")).toBe(hashString("path_1"));
    const h = hashString("path_1");
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(65536);
  });

  it("separates different inputs", () => {
    expect(hashString("path_1")).not.toBe(hashString("path_2"));
  });
});

describe("roughenParams", () => {
  it("scales displacement and wavelength with the viewBox diagonal", () => {
    const small = roughenParams(100);
    const large = roughenParams(400);
    // Bigger illustration → bigger absolute displacement, lower frequency.
    expect(large.scale).toBeGreaterThan(small.scale);
    expect(large.baseFrequency).toBeLessThan(small.baseFrequency);
  });

  it("is deterministic and positive", () => {
    const p = roughenParams(283);
    expect(p).toEqual(roughenParams(283));
    expect(p.scale).toBeGreaterThan(0);
    expect(p.baseFrequency).toBeGreaterThan(0);
  });
});

describe("strokeWidthMultiplier", () => {
  it("is deterministic per path id", () => {
    expect(strokeWidthMultiplier("path_1")).toBe(strokeWidthMultiplier("path_1"));
  });

  it("stays within the jitter band", () => {
    for (const id of ["a", "b", "path_123", "xyz", "M0"]) {
      const m = strokeWidthMultiplier(id);
      expect(m).toBeGreaterThanOrEqual(1 - STROKE_JITTER.amount);
      expect(m).toBeLessThanOrEqual(1 + STROKE_JITTER.amount);
    }
  });

  it("varies across path ids", () => {
    expect(strokeWidthMultiplier("path_1")).not.toBe(strokeWidthMultiplier("path_2"));
  });
});
