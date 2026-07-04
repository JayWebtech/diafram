import { z } from "zod";
import { CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_FPS, SCHEMA_VERSION } from "./constants";
import { zProjectId } from "./ids";
import { zIllustration } from "./illustration";
import { zHexColor } from "./primitives";
import { zScene } from "./scene";

/**
 * `VideoProject` — the top-level contract.
 *
 * This is the single object that the AI pipeline produces, the database stores,
 * and the renderer consumes. It is deliberately *self-contained*: every
 * illustration referenced by a layer is embedded in `illustrations`, so a
 * render worker needs nothing but this object (plus the R2 assets it points to)
 * to produce the video.
 */
export const zVideoProject = z
  .object({
    id: zProjectId,
    title: z.string().min(1),
    schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),

    // Render settings. Locked to the pipeline target by default, but kept in the
    // document so a render is reproducible even if the defaults later change.
    fps: z.number().int().positive().default(DEFAULT_FPS),
    width: z.number().int().positive().default(CANVAS_WIDTH),
    height: z.number().int().positive().default(CANVAS_HEIGHT),

    /** Optional project-wide accent color, inherited by illustrations that omit one. */
    accentColor: zHexColor.nullable().default(null),

    scenes: z.array(zScene).min(1, "A project needs at least one scene"),

    /** Every illustration referenced anywhere in the project, embedded for self-containment. */
    illustrations: z.array(zIllustration),
  })
  .superRefine((project, ctx) => {
    // Illustration ids must be unique so lookups are unambiguous.
    const seen = new Set<string>();
    project.illustrations.forEach((ill, i) => {
      if (seen.has(ill.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["illustrations", i, "id"],
          message: `Duplicate illustration id: ${ill.id}`,
        });
      }
      seen.add(ill.id);
    });

    // Referential integrity: every layer must point at an embedded illustration.
    // This is the invariant the renderer relies on to never hit a missing asset.
    project.scenes.forEach((scene, si) => {
      scene.layers.forEach((layer, li) => {
        if (!seen.has(layer.illustrationId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["scenes", si, "layers", li, "illustrationId"],
            message: `Layer references unknown illustration: ${layer.illustrationId}`,
          });
        }
      });
    });
  });
export type VideoProject = z.infer<typeof zVideoProject>;

/** Total duration of a project in frames — the sum of its scene durations. */
export function projectDurationInFrames(project: VideoProject): number {
  return project.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
}
