import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_FPS,
  newLayerId,
  newProjectId,
  newTextId,
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

export interface SceneNarrationInput {
  audioDataUri: string;
  durationSeconds: number;
}

export interface CompileOptions {
  storyboard: Storyboard;
  title: string;
  /** Illustrations for each scene, aligned to `storyboard.scenes` order. */
  sceneIllustrations: Illustration[][];
  /** Optional narration audio per scene, aligned to scene order. */
  sceneNarration?: Array<SceneNarrationInput | null>;
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
    const narration = options.sceneNarration?.[sceneIndex] ?? null;

    // A scene lasts at least its storyboard length and, when narrated, long
    // enough to finish speaking (plus a short tail).
    const narrationFrames = narration
      ? secondsToFrames(narration.durationSeconds + 0.6, fps)
      : 0;
    const durationInFrames = Math.max(
      2,
      secondsToFrames(sbScene.durationSeconds, fps),
      narrationFrames,
    );

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

    // The scene title as a typewritten caption across the top, clear of the
    // centered illustration row.
    const titleText = {
      id: newTextId(),
      content: sbScene.title,
      x: width / 2,
      y: Math.round(height * 0.12),
      fontSize: Math.round(height * 0.07),
      fontWeight: 600,
      color: "#111111",
      align: "center" as const,
      startFrame: 0,
      revealDurationInFrames: Math.max(8, Math.round(0.7 * fps)),
      reveal: "typewriter" as const,
    };

    return {
      id: `scn_${sbScene.index}_${sbScene.title.slice(0, 8)}`.replace(/[^\w]/g, "_"),
      name: sbScene.title,
      durationInFrames,
      transitionIn: sbScene.transition,
      narration: sbScene.narration,
      camera: cameraForIntent(sbScene.cameraIntent, durationInFrames, width, sceneIndex + 1),
      layers,
      texts: [titleText],
      narrationAudioUrl: narration?.audioDataUri ?? null,
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
