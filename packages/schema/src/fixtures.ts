import { staticCamera } from "./camera";
import {
  newIllustrationId,
  newLayerId,
  newPathId,
  newProjectId,
  newSceneId,
} from "./ids";
import { zIllustration, type Illustration } from "./illustration";
import type { Scene } from "./scene";
import { IDENTITY_TRANSFORM } from "./primitives";
import { zVideoProject, type VideoProject } from "./project";

/**
 * Canonical fixtures used by tests across packages (schema, engine, renderer).
 *
 * These build *valid* documents so downstream packages have a realistic sample
 * to exercise the timeline and renderer against without invoking the AI pipeline.
 */

/** A minimal single-path illustration (a diagonal stroke) with a known length. */
export function makeIllustration(overrides: Partial<Illustration> = {}): Illustration {
  const id = overrides.id ?? newIllustrationId();
  // Parse to apply schema defaults (reveal, markup, …) and stay valid by construction.
  return zIllustration.parse({
    id,
    name: "diagonal stroke",
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    paths: [
      {
        id: newPathId(),
        d: "M0 0 L100 100",
        order: 0,
        length: Math.sqrt(100 * 100 + 100 * 100),
        strokeWidth: 8,
        stroke: "#111111",
        fill: null,
      },
    ],
    accentColor: null,
    promptHash: null,
    styleVersion: 1,
    ...overrides,
  });
}

/** A one-scene, one-layer project that satisfies every schema invariant. */
export function makeVideoProject(overrides: Partial<VideoProject> = {}): VideoProject {
  const illustration = makeIllustration();

  const scene: Scene = {
    id: newSceneId(),
    name: "Intro",
    durationInFrames: 240,
    transitionIn: "cut",
    camera: staticCamera(1),
    narration: "This is the intro.",
    narrationAudioUrl: null,
    notes: "",
    texts: [],
    layers: [
      {
        id: newLayerId(),
        illustrationId: illustration.id,
        startFrame: 0,
        drawDurationInFrames: 60,
        transform: { ...IDENTITY_TRANSFORM },
        drawOrder: 0,
        opacity: 1,
      },
    ],
  };

  // Parse to apply defaults and guarantee the fixture is valid by construction.
  return zVideoProject.parse({
    id: newProjectId(),
    title: "Fixture project",
    scenes: [scene],
    illustrations: [illustration],
    ...overrides,
  });
}
