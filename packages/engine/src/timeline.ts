import type { Layer, Scene, VideoProject } from "@diafram/schema";
import { isLayerActive } from "./draw";

/**
 * The timeline engine.
 *
 * `compileTimeline` flattens a project's scenes into absolute frame ranges once,
 * so per-frame lookups during preview/render are cheap and allocation-free. All
 * frames in the compiled result are *global* (0 = start of the video); the
 * `localFrame` returned by `getSceneAtFrame` is scene-relative for feeding the
 * camera and draw engines.
 */

export interface CompiledScene {
  scene: Scene;
  /** Position of the scene in the project. */
  index: number;
  /** Absolute (global) frame where the scene begins, inclusive. */
  startFrame: number;
  /** Absolute (global) frame where the scene ends, exclusive. */
  endFrame: number;
  durationInFrames: number;
}

export interface CompiledTimeline {
  fps: number;
  /** Total video length in frames — valid frames are [0, durationInFrames). */
  durationInFrames: number;
  scenes: CompiledScene[];
}

/** Flatten a project into absolute scene frame ranges. Pure and cheap. */
export function compileTimeline(project: VideoProject): CompiledTimeline {
  let cursor = 0;
  const scenes: CompiledScene[] = project.scenes.map((scene, index) => {
    const startFrame = cursor;
    const endFrame = startFrame + scene.durationInFrames;
    cursor = endFrame;
    return {
      scene,
      index,
      startFrame,
      endFrame,
      durationInFrames: scene.durationInFrames,
    };
  });

  return { fps: project.fps, durationInFrames: cursor, scenes };
}

export interface ResolvedFrame {
  compiledScene: CompiledScene;
  /** Frame relative to the start of the resolved scene. */
  localFrame: number;
}

/**
 * Resolve which scene is on screen at a global frame, and the scene-local frame.
 * Returns `null` for frames outside the video's range.
 */
export function getSceneAtFrame(
  timeline: CompiledTimeline,
  globalFrame: number,
): ResolvedFrame | null {
  if (globalFrame < 0 || globalFrame >= timeline.durationInFrames) return null;
  for (const compiledScene of timeline.scenes) {
    if (globalFrame >= compiledScene.startFrame && globalFrame < compiledScene.endFrame) {
      return { compiledScene, localFrame: globalFrame - compiledScene.startFrame };
    }
  }
  return null;
}

/** Layers of a scene that have begun drawing at the given scene-local frame. */
export function getActiveLayers(scene: Scene, sceneLocalFrame: number): Layer[] {
  return scene.layers.filter((layer) => isLayerActive(layer, sceneLocalFrame));
}
