import { makeIllustration, makeVideoProject } from "@diafram/schema/fixtures";
import { newLayerId, newPathId } from "@diafram/schema";
import type { CameraTrack, Illustration, Layer } from "@diafram/schema";
import { describe, expect, it } from "vitest";
import { applyEasing } from "./easing";
import { interpolate, lerp } from "./interpolate";
import { valueNoise1D } from "./rng";
import { getCameraTransform } from "./camera";
import { getActivePath, getIllustrationDrawState, getLayerDrawProgress } from "./draw";
import { compileTimeline, getSceneAtFrame } from "./timeline";

describe("easing", () => {
  it("pins endpoints for every easing", () => {
    for (const name of ["linear", "easeIn", "easeOut", "easeInOut", "circIn", "circOut", "circInOut"] as const) {
      expect(applyEasing(name, 0)).toBeCloseTo(0, 6);
      expect(applyEasing(name, 1)).toBeCloseTo(1, 6);
    }
  });

  it("clamps out-of-range input", () => {
    expect(applyEasing("linear", -1)).toBe(0);
    expect(applyEasing("linear", 2)).toBe(1);
  });
});

describe("interpolate", () => {
  it("maps ranges linearly", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(interpolate(5, [0, 10], [0, 100])).toBe(50);
  });

  it("clamps by default and extrapolates when disabled", () => {
    expect(interpolate(20, [0, 10], [0, 100])).toBe(100);
    expect(interpolate(20, [0, 10], [0, 100], { clamp: false })).toBe(200);
  });

  it("handles a degenerate input range", () => {
    expect(interpolate(5, [3, 3], [7, 9])).toBe(7);
  });
});

describe("value noise", () => {
  it("is deterministic for the same input", () => {
    expect(valueNoise1D(4.2, 99)).toBe(valueNoise1D(4.2, 99));
  });

  it("differs across seeds and stays within range", () => {
    for (let x = 0; x < 50; x += 0.37) {
      const v = valueNoise1D(x, 7);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(valueNoise1D(4.2, 1)).not.toBe(valueNoise1D(4.2, 2));
  });
});

describe("camera", () => {
  const track: CameraTrack = {
    keyframes: [
      { frame: 0, x: 0, y: 0, scale: 1, rotation: 0, easing: "linear" },
      { frame: 30, x: 100, y: 0, scale: 2, rotation: 0, easing: "linear" },
    ],
    shake: null,
  };

  it("returns keyframe values at the keyframes", () => {
    expect(getCameraTransform(track, 0, 30)).toMatchObject({ x: 0, scale: 1 });
    expect(getCameraTransform(track, 30, 30)).toMatchObject({ x: 100, scale: 2 });
  });

  it("interpolates linearly at the midpoint", () => {
    const mid = getCameraTransform(track, 15, 30);
    expect(mid.x).toBeCloseTo(50, 6);
    expect(mid.scale).toBeCloseTo(1.5, 6);
  });

  it("holds the last keyframe past the end", () => {
    expect(getCameraTransform(track, 999, 30)).toMatchObject({ x: 100, scale: 2 });
  });

  it("adds deterministic shake and leaves scale untouched", () => {
    const shaky: CameraTrack = {
      keyframes: [{ frame: 0, x: 0, y: 0, scale: 1, rotation: 0, easing: "linear" }],
      shake: { amplitude: 10, frequency: 4, seed: 123 },
    };
    const a = getCameraTransform(shaky, 12, 30);
    const b = getCameraTransform(shaky, 12, 30);
    expect(a).toEqual(b);
    expect(a.scale).toBe(1);
    expect(Math.abs(a.x)).toBeLessThanOrEqual(10);
  });
});

describe("hand-drawing", () => {
  const twoPaths: Illustration = makeIllustration({
    paths: [
      { id: newPathId(), d: "M0 0 L10 0", order: 0, length: 10, strokeWidth: 8, stroke: "#111111", fill: null },
      { id: newPathId(), d: "M0 0 L30 0", order: 1, length: 30, strokeWidth: 8, stroke: "#111111", fill: null },
    ],
  });
  const layer: Layer = {
    id: newLayerId(),
    illustrationId: twoPaths.id,
    startFrame: 0,
    drawDurationInFrames: 40,
    transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    drawOrder: 0,
    opacity: 1,
  };

  it("progresses from 0 to 1 across the draw window", () => {
    expect(getLayerDrawProgress(layer, -5)).toBe(0);
    expect(getLayerDrawProgress(layer, 20)).toBe(0.5);
    expect(getLayerDrawProgress(layer, 40)).toBe(1);
    expect(getLayerDrawProgress(layer, 999)).toBe(1);
  });

  it("draws paths in order — the first finishes before the second starts", () => {
    // 25% overall = 10 of 40 length units = exactly the first path fully drawn.
    const quarter = getIllustrationDrawState(twoPaths, layer, 10);
    expect(quarter.paths[0]!.progress).toBeCloseTo(1, 6);
    expect(quarter.paths[1]!.progress).toBeCloseTo(0, 6);
  });

  it("produces stroke-dash values that reveal the path", () => {
    const done = getIllustrationDrawState(twoPaths, layer, 40);
    expect(done.paths[0]!.dashOffset).toBeCloseTo(0, 6);
    expect(done.paths[1]!.dashOffset).toBeCloseTo(0, 6);
    const none = getIllustrationDrawState(twoPaths, layer, 0);
    expect(none.paths[0]!.dashOffset).toBeCloseTo(10, 6);
    expect(none.paths[1]!.dashOffset).toBeCloseTo(30, 6);
  });

  it("locates the active path under the pen", () => {
    // Not started / finished → no pen.
    expect(getActivePath(getIllustrationDrawState(twoPaths, layer, 0))).toBeNull();
    expect(getActivePath(getIllustrationDrawState(twoPaths, layer, 40))).toBeNull();

    // Early: first (long-ordered) path is mid-draw.
    const early = getActivePath(getIllustrationDrawState(twoPaths, layer, 5));
    expect(early).not.toBeNull();
    expect(early!.progress).toBeGreaterThan(0);
    expect(early!.progress).toBeLessThan(1);

    // Late in the window: the second path is the one under the pen.
    const late = getActivePath(getIllustrationDrawState(twoPaths, layer, 30));
    expect(late!.id).toBe(twoPaths.paths[1]!.id);
  });
});

describe("timeline", () => {
  it("compiles absolute scene ranges and total duration", () => {
    const project = makeVideoProject();
    const timeline = compileTimeline(project);
    expect(timeline.durationInFrames).toBe(240);
    expect(timeline.scenes[0]).toMatchObject({ startFrame: 0, endFrame: 240 });
  });

  it("resolves the scene and local frame at a global frame", () => {
    const project = makeVideoProject();
    const timeline = compileTimeline(project);
    const resolved = getSceneAtFrame(timeline, 100);
    expect(resolved?.localFrame).toBe(100);
    expect(getSceneAtFrame(timeline, 240)).toBeNull();
    expect(getSceneAtFrame(timeline, -1)).toBeNull();
  });
});
