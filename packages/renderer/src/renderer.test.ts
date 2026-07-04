import type { Transform, ViewBox } from "@diafram/schema";
import { describe, expect, it } from "vitest";
import { cameraTransformString, layerTransformString } from "./geometry";
import { getSceneIntroStyle } from "./transitions";

describe("geometry", () => {
  it("builds an identity camera transform that recenters cleanly", () => {
    const identity: Transform = { x: 0, y: 0, scale: 1, rotation: 0 };
    const str = cameraTransformString(identity, 1920, 1080);
    expect(str).toContain("scale(1)");
    expect(str).toContain("rotate(0)");
    // Center out and center back cancel; pan is zero.
    expect(str).toContain("translate(960, 540)");
    expect(str).toContain("translate(-960, -540)");
    expect(str).toContain("translate(0, 0)");
  });

  it("encodes camera zoom and pan", () => {
    const t: Transform = { x: 100, y: -50, scale: 2, rotation: 15 };
    const str = cameraTransformString(t, 1920, 1080);
    expect(str).toContain("scale(2)");
    expect(str).toContain("rotate(15)");
    expect(str).toContain("translate(100, -50)");
  });

  it("maps a non-zero illustration viewBox origin to the layer position", () => {
    const t: Transform = { x: 200, y: 300, scale: 1.5, rotation: 0 };
    const viewBox: ViewBox = { minX: 10, minY: 20, width: 100, height: 100 };
    const str = layerTransformString(t, viewBox);
    expect(str).toContain("translate(200, 300)");
    expect(str).toContain("scale(1.5)");
    expect(str).toContain("translate(-10, -20)");
  });
});

describe("scene intro transitions", () => {
  it("cut is a no-op", () => {
    expect(getSceneIntroStyle("cut", 0, 30, 1920, 1080)).toEqual({ opacity: 1, transform: "" });
    expect(getSceneIntroStyle("cut", 100, 30, 1920, 1080)).toEqual({ opacity: 1, transform: "" });
  });

  it("fade ramps opacity from 0 to 1 and settles", () => {
    expect(getSceneIntroStyle("fade", 0, 30, 1920, 1080).opacity).toBeCloseTo(0, 5);
    expect(getSceneIntroStyle("fade", 30, 30, 1920, 1080).opacity).toBe(1);
  });

  it("slide moves in from the right and settles at zero offset", () => {
    const start = getSceneIntroStyle("slide", 0, 30, 1920, 1080);
    const end = getSceneIntroStyle("slide", 30, 30, 1920, 1080);
    expect(start.transform).toContain("translate(288"); // 1920 * 0.15
    expect(end.transform).toBe("translate(0.0000, 0)");
  });

  it("zoom eases scale from 0.9 to 1", () => {
    const end = getSceneIntroStyle("zoom", 30, 30, 1920, 1080);
    expect(end.transform).toContain("scale(1.0000)");
    expect(end.opacity).toBe(1);
  });
});
