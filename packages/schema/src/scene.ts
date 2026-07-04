import { z } from "zod";
import { zCameraTrack } from "./camera";
import { zSceneId } from "./ids";
import { zLayer } from "./layer";
import { zDurationFrames } from "./primitives";

/**
 * Scene-level transition into the scene.
 *
 * Note: these apply between *scenes*, which is distinct from the "never fade an
 * illustration in" rule. A whole scene may fade or whip-pan; individual
 * illustrations are always drawn stroke-by-stroke.
 */
export const SCENE_TRANSITIONS = ["cut", "fade", "slide", "zoom", "whipPan"] as const;
export const zSceneTransition = z.enum(SCENE_TRANSITIONS);
export type SceneTransition = z.infer<typeof zSceneTransition>;

export const zScene = z
  .object({
    id: zSceneId,
    /** Short label for the editor, e.g. "Lock appears". */
    name: z.string().min(1),
    durationInFrames: zDurationFrames,
    transitionIn: zSceneTransition.default("cut"),
    camera: zCameraTrack,
    layers: z.array(zLayer),
    /** Narration text for this scene (voice generation is out of scope for now). */
    narration: z.string().default(""),
    /** Optional authoring notes, not rendered. */
    notes: z.string().default(""),
  })
  .superRefine((scene, ctx) => {
    // A layer that starts after the scene ends can never be seen — almost always
    // an authoring/AI mistake, so reject it rather than silently drop frames.
    scene.layers.forEach((layer, i) => {
      if (layer.startFrame >= scene.durationInFrames) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["layers", i, "startFrame"],
          message: `Layer starts at frame ${layer.startFrame} but the scene is only ${scene.durationInFrames} frames long`,
        });
      }
    });

    // Camera keyframes are scene-local; the last one must not sit past the end of
    // the scene, or the final segment of the move would be clipped.
    const lastKeyframe = scene.camera.keyframes.at(-1);
    if (lastKeyframe && lastKeyframe.frame >= scene.durationInFrames) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["camera", "keyframes"],
        message: `Last camera keyframe at frame ${lastKeyframe.frame} exceeds scene duration ${scene.durationInFrames}`,
      });
    }
  });
export type Scene = z.infer<typeof zScene>;
