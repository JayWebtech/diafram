import { describe, expect, it } from "vitest";
import { zCameraTrack } from "./camera";
import { newIllustrationId } from "./ids";
import { makeIllustration, makeVideoProject } from "./fixtures";
import { zHexColor, zTransform } from "./primitives";
import { projectDurationInFrames, zVideoProject } from "./project";
import { zScene } from "./scene";
import { zTextElement } from "./text";
import { newTextId } from "./ids";
import { secondsToFrames, viewBoxToString } from "./helpers";

describe("primitives", () => {
  it("accepts valid hex colors and rejects invalid ones", () => {
    expect(zHexColor.safeParse("#111").success).toBe(true);
    expect(zHexColor.safeParse("#1a1a1a").success).toBe(true);
    expect(zHexColor.safeParse("red").success).toBe(false);
    expect(zHexColor.safeParse("#1234").success).toBe(false);
    expect(zHexColor.safeParse("rgb(0,0,0)").success).toBe(false);
  });

  it("rejects a non-positive scale in a transform", () => {
    expect(zTransform.safeParse({ x: 0, y: 0, scale: 1, rotation: 0 }).success).toBe(true);
    expect(zTransform.safeParse({ x: 0, y: 0, scale: 0, rotation: 0 }).success).toBe(false);
    expect(zTransform.safeParse({ x: 0, y: 0, scale: -1, rotation: 0 }).success).toBe(false);
  });
});

describe("helpers", () => {
  it("serializes a viewBox", () => {
    expect(viewBoxToString({ minX: 0, minY: 0, width: 100, height: 50 })).toBe("0 0 100 50");
  });

  it("converts seconds to whole frames", () => {
    expect(secondsToFrames(8, 30)).toBe(240);
    expect(secondsToFrames(1.5, 30)).toBe(45);
  });
});

describe("camera track", () => {
  it("requires strictly ascending keyframes", () => {
    const bad = {
      keyframes: [
        { frame: 0, x: 0, y: 0, scale: 1, rotation: 0, easing: "linear" },
        { frame: 0, x: 10, y: 0, scale: 1, rotation: 0, easing: "linear" },
      ],
      shake: null,
    };
    expect(zCameraTrack.safeParse(bad).success).toBe(false);
  });

  it("accepts a well-ordered track", () => {
    const ok = {
      keyframes: [
        { frame: 0, x: 0, y: 0, scale: 1, rotation: 0, easing: "linear" },
        { frame: 30, x: 10, y: 0, scale: 1.2, rotation: 0, easing: "easeInOut" },
      ],
      shake: null,
    };
    expect(zCameraTrack.safeParse(ok).success).toBe(true);
  });
});

describe("scene invariants", () => {
  const baseScene = () => ({
    id: "scn_test000000000",
    name: "Test",
    durationInFrames: 100,
    transitionIn: "cut",
    camera: { keyframes: [{ frame: 0, x: 0, y: 0, scale: 1, rotation: 0, easing: "linear" }], shake: null },
    layers: [],
    narration: "",
    notes: "",
  });

  it("rejects a layer that starts after the scene ends", () => {
    const scene = {
      ...baseScene(),
      layers: [
        {
          id: "lyr_test000000000",
          illustrationId: "ill_test00000000",
          startFrame: 150,
          drawDurationInFrames: 30,
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          drawOrder: 0,
          opacity: 1,
        },
      ],
    };
    expect(zScene.safeParse(scene).success).toBe(false);
  });

  it("rejects a camera keyframe past the scene end", () => {
    const scene = {
      ...baseScene(),
      camera: {
        keyframes: [
          { frame: 0, x: 0, y: 0, scale: 1, rotation: 0, easing: "linear" },
          { frame: 200, x: 0, y: 0, scale: 2, rotation: 0, easing: "linear" },
        ],
        shake: null,
      },
    };
    expect(zScene.safeParse(scene).success).toBe(false);
  });
});

describe("text element", () => {
  it("applies reveal/align/weight defaults", () => {
    const text = zTextElement.parse({
      id: newTextId(),
      content: "Hello",
      x: 960,
      y: 120,
      fontSize: 72,
    });
    expect(text.reveal).toBe("fade");
    expect(text.align).toBe("center");
    expect(text.fontWeight).toBe(600);
    expect(text.color).toBe("#111111");
  });

  it("rejects empty content and non-positive font size", () => {
    expect(zTextElement.safeParse({ id: newTextId(), content: "", x: 0, y: 0, fontSize: 40 }).success).toBe(false);
    expect(zTextElement.safeParse({ id: newTextId(), content: "x", x: 0, y: 0, fontSize: 0 }).success).toBe(false);
  });

  it("rejects text starting after the scene ends", () => {
    const scene = {
      id: "scn_test000000000",
      name: "Test",
      durationInFrames: 100,
      transitionIn: "cut",
      camera: { keyframes: [{ frame: 0, x: 0, y: 0, scale: 1, rotation: 0, easing: "linear" }], shake: null },
      layers: [],
      texts: [{ id: newTextId(), content: "late", x: 0, y: 0, fontSize: 40, startFrame: 150 }],
      narration: "",
      notes: "",
    };
    expect(zScene.safeParse(scene).success).toBe(false);
  });
});

describe("video project", () => {
  it("builds a valid fixture project", () => {
    const project = makeVideoProject();
    expect(zVideoProject.safeParse(project).success).toBe(true);
  });

  it("computes total duration as the sum of scene durations", () => {
    const project = makeVideoProject();
    expect(projectDurationInFrames(project)).toBe(240);
  });

  it("rejects a layer referencing an unknown illustration", () => {
    const project = makeVideoProject();
    const orphan = { ...project };
    orphan.scenes = project.scenes.map((scene) => ({
      ...scene,
      layers: scene.layers.map((layer) => ({ ...layer, illustrationId: newIllustrationId() })),
    }));
    expect(zVideoProject.safeParse(orphan).success).toBe(false);
  });

  it("rejects duplicate illustration ids", () => {
    const shared = newIllustrationId();
    const a = makeIllustration({ id: shared });
    const b = makeIllustration({ id: shared });
    const project = makeVideoProject();
    const dup = { ...project, illustrations: [a, b] };
    expect(zVideoProject.safeParse(dup).success).toBe(false);
  });

  it("applies render defaults (fps, width, height, schemaVersion)", () => {
    const project = makeVideoProject();
    expect(project.fps).toBe(30);
    expect(project.width).toBe(1920);
    expect(project.height).toBe(1080);
    expect(project.schemaVersion).toBe(1);
  });
});
