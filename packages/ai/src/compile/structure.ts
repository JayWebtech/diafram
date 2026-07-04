import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_FPS,
  newLayerId,
  newProjectId,
  secondsToFrames,
  zVideoProject,
  type Illustration,
  type Storyboard,
  type VideoProject,
} from "@diafram/schema";
import { cameraForIntent, layoutInRow } from "./layout";

/**
 * Structuring compiler — Step 2 of the pipeline.
 *
 * Turns an approved storyboard plus the illustrations generated for each scene
 * into a strict, render-ready `VideoProject`. Entirely deterministic: seconds
 * become frames, illustrations are laid out and staggered, cameras come from
 * intents, and the result is validated by `zVideoProject.parse` (so any layout
 * bug surfaces as a schema error rather than a bad render).
 */

export interface CompileOptions {
  storyboard: Storyboard;
  title: string;
  /** Illustrations for each scene, aligned to `storyboard.scenes` order. */
  sceneIllustrations: Illustration[][];
  fps?: number;
  width?: number;
  height?: number;
  accentColor?: string | null;
}

export function compileProject(options: CompileOptions): VideoProject {
  const fps = options.fps ?? DEFAULT_FPS;
  const width = options.width ?? CANVAS_WIDTH;
  const height = options.height ?? CANVAS_HEIGHT;

  const stagger = Math.max(1, Math.round(0.35 * fps));
  const maxDraw = Math.round(1.6 * fps);
  const uniqueIllustrations = new Map<string, Illustration>();

  const scenes = options.storyboard.scenes.map((sbScene, sceneIndex) => {
    const illustrations = options.sceneIllustrations[sceneIndex] ?? [];
    const durationInFrames = Math.max(2, secondsToFrames(sbScene.durationSeconds, fps));

    const layers = illustrations.map((illustration, i) => {
      uniqueIllustrations.set(illustration.id, illustration);

      // Stagger draw starts, always leaving room to draw before the scene ends.
      const startFrame = Math.min(i * stagger, Math.max(0, durationInFrames - 9));
      const drawDurationInFrames = Math.max(
        8,
        Math.min(maxDraw, durationInFrames - startFrame),
      );

      return {
        id: newLayerId(),
        illustrationId: illustration.id,
        startFrame,
        drawDurationInFrames,
        transform: layoutInRow(illustration, i, illustrations.length, width, height),
        drawOrder: i,
      };
    });

    return {
      id: `scn_${sbScene.index}_${sbScene.title.slice(0, 8)}`.replace(/[^\w]/g, "_"),
      name: sbScene.title,
      durationInFrames,
      transitionIn: sbScene.transition,
      narration: sbScene.narration,
      camera: cameraForIntent(sbScene.cameraIntent, durationInFrames, width, sceneIndex + 1),
      layers,
    };
  });

  return zVideoProject.parse({
    id: newProjectId(),
    title: options.title,
    accentColor: options.accentColor ?? null,
    fps,
    width,
    height,
    scenes,
    illustrations: [...uniqueIllustrations.values()],
  });
}
