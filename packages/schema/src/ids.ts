import { z } from "zod";

/**
 * Branded id types.
 *
 * Branding stops us from accidentally passing an `IllustrationId` where a
 * `SceneId` is expected — they are all strings at runtime but distinct at the
 * type level. Ids are opaque; nothing should parse meaning out of them.
 */

const brandedId = <B extends string>(brand: B) => z.string().min(1).brand(brand);

export const zProjectId = brandedId("ProjectId");
export const zSceneId = brandedId("SceneId");
export const zLayerId = brandedId("LayerId");
export const zIllustrationId = brandedId("IllustrationId");
export const zPathId = brandedId("PathId");
export const zStoryboardId = brandedId("StoryboardId");

export type ProjectId = z.infer<typeof zProjectId>;
export type SceneId = z.infer<typeof zSceneId>;
export type LayerId = z.infer<typeof zLayerId>;
export type IllustrationId = z.infer<typeof zIllustrationId>;
export type PathId = z.infer<typeof zPathId>;
export type StoryboardId = z.infer<typeof zStoryboardId>;

/**
 * Generate a fresh, url-safe, collision-resistant id with a human-readable
 * prefix (e.g. `scn_a1b2c3d4`). Uses `crypto.randomUUID`, available in Node 20+
 * and every modern browser, so it works identically in the editor and the
 * render worker.
 */
export function newId(prefix: string): string {
  const uuid = crypto.randomUUID().replace(/-/g, "");
  return `${prefix}_${uuid.slice(0, 16)}`;
}

export const newProjectId = () => zProjectId.parse(newId("prj"));
export const newSceneId = () => zSceneId.parse(newId("scn"));
export const newLayerId = () => zLayerId.parse(newId("lyr"));
export const newIllustrationId = () => zIllustrationId.parse(newId("ill"));
export const newPathId = () => zPathId.parse(newId("pth"));
export const newStoryboardId = () => zStoryboardId.parse(newId("stb"));
