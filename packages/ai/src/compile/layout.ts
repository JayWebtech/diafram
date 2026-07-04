import type { CameraIntent, Illustration, Transform } from "@diafram/schema";

/**
 * Deterministic layout + camera presets for structuring.
 *
 * v1 structuring is algorithmic rather than LLM-driven: illustrations are placed
 * in a centered row and camera moves come from the storyboard's `cameraIntent`.
 * This keeps Step 2 fully deterministic and testable; an LLM "art director" that
 * proposes bespoke layouts can slot in behind the same interface later.
 */

/** Fraction of canvas height a single illustration should occupy. */
const TARGET_HEIGHT_FRACTION = 0.5;

/** Place illustration `index` of `count` in a centered horizontal row. */
export function layoutInRow(
  illustration: Illustration,
  index: number,
  count: number,
  canvasWidth: number,
  canvasHeight: number,
): Transform {
  const { width: vbW, height: vbH } = illustration.viewBox;
  const scale = (canvasHeight * TARGET_HEIGHT_FRACTION) / vbH;
  const scaledW = vbW * scale;
  const scaledH = vbH * scale;

  const slotWidth = canvasWidth / count;
  const slotCenterX = (index + 0.5) * slotWidth;

  return {
    x: slotCenterX - scaledW / 2,
    y: (canvasHeight - scaledH) / 2,
    scale,
    rotation: 0,
  };
}

export interface CameraKeyframeInput {
  frame: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface CameraTrackInput {
  keyframes: CameraKeyframeInput[];
  shake?: { amplitude: number; frequency: number; seed: number } | null;
}

/**
 * Build a camera track for a scene from its intent. Frames are scene-local and
 * the last keyframe is kept strictly inside the scene (`duration - 1`).
 */
export function cameraForIntent(
  intent: CameraIntent,
  durationInFrames: number,
  canvasWidth: number,
  seed: number,
): CameraTrackInput {
  const end = Math.max(1, durationInFrames - 1);
  const kf = (frame: number, scale: number, x = 0, y = 0): CameraKeyframeInput => ({
    frame,
    x,
    y,
    scale,
    rotation: 0,
  });

  switch (intent) {
    case "static":
      return { keyframes: [kf(0, 1)], shake: null };

    case "zoom":
      return { keyframes: [kf(0, 1), kf(end, 1.15)], shake: null };

    case "pan": {
      const dx = canvasWidth * 0.04;
      return { keyframes: [kf(0, 1.05, -dx), kf(end, 1.05, dx)], shake: null };
    }

    case "focus": {
      const mid = Math.round(durationInFrames * 0.5);
      // Guard against a middle keyframe colliding with the endpoints on short scenes.
      const keyframes =
        mid > 0 && mid < end
          ? [kf(0, 0.92), kf(mid, 1.2), kf(end, 1.2)]
          : [kf(0, 0.92), kf(end, 1.2)];
      return { keyframes, shake: null };
    }

    case "shake":
      return {
        keyframes: [kf(0, 1.02)],
        shake: { amplitude: 10, frequency: 6, seed },
      };

    default:
      return { keyframes: [kf(0, 1)], shake: null };
  }
}
