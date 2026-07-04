import type { SceneTransition } from "@diafram/schema";
import { interpolate } from "@diafram/engine";

/**
 * Scene intro transitions.
 *
 * These are *intro-only* effects applied over the first fraction of a scene —
 * deterministic and self-contained, with no cross-scene overlap. (True
 * cross-fades between overlapping scenes are a later feature that needs the
 * timeline to premount the neighbouring scene.) They wrap the whole scene and
 * are distinct from the per-illustration hand-drawing, which is never a fade.
 */

/** Duration of a standard intro, in seconds. */
const INTRO_SECONDS = 0.4;
/** Whip-pans are snappier. */
const WHIP_SECONDS = 0.22;

export interface SceneIntroStyle {
  opacity: number;
  /** SVG transform string applied to the scene wrapper (empty when none). */
  transform: string;
}

/** Compute the intro opacity/transform for a scene at a scene-local frame. */
export function getSceneIntroStyle(
  transition: SceneTransition,
  localFrame: number,
  fps: number,
  width: number,
  height: number,
): SceneIntroStyle {
  const d = Math.max(1, Math.round(INTRO_SECONDS * fps));

  switch (transition) {
    case "cut":
      return { opacity: 1, transform: "" };

    case "fade": {
      const opacity = interpolate(localFrame, [0, d], [0, 1], { easing: "easeOut" });
      return { opacity, transform: "" };
    }

    case "slide": {
      const dx = interpolate(localFrame, [0, d], [width * 0.15, 0], { easing: "easeOut" });
      return { opacity: 1, transform: `translate(${dx.toFixed(4)}, 0)` };
    }

    case "zoom": {
      const scale = interpolate(localFrame, [0, d], [0.9, 1], { easing: "easeOut" });
      const cx = width / 2;
      const cy = height / 2;
      return {
        opacity: interpolate(localFrame, [0, d], [0, 1], { easing: "easeOut" }),
        transform: `translate(${cx}, ${cy}) scale(${scale.toFixed(4)}) translate(${-cx}, ${-cy})`,
      };
    }

    case "whipPan": {
      const wd = Math.max(1, Math.round(WHIP_SECONDS * fps));
      const dx = interpolate(localFrame, [0, wd], [width * 0.6, 0], { easing: "circOut" });
      return { opacity: 1, transform: `translate(${dx.toFixed(4)}, 0)` };
    }

    default:
      return { opacity: 1, transform: "" };
  }
}
