import { arcPoints, polyline, type BuiltPath } from "./svgbuild";

/**
 * A small hand-authored illustration library for the sample explainer.
 *
 * These are plain objects (string ids, no defaults) that get validated and
 * branded by `zVideoProject.parse` in `project.ts`. They exist to exercise the
 * renderer end-to-end without the AI pipeline, and to demonstrate reuse — the
 * notebook and person appear in more than one scene.
 */

type PlainPath = {
  id: string;
  order: number;
  d: string;
  length: number;
  strokeWidth?: number;
  stroke?: string;
  fill?: string | null;
};

type PlainIllustration = {
  id: string;
  name: string;
  viewBox: { minX: number; minY: number; width: number; height: number };
  paths: PlainPath[];
  accentColor?: string | null;
};

function path(name: string, order: number, built: BuiltPath, extra: Partial<PlainPath> = {}): PlainPath {
  return { id: `pth_${name}_${order}`, order, d: built.d, length: built.length, ...extra };
}

const ACCENT = "#f97316";

export const notebook: PlainIllustration = {
  id: "ill_notebook",
  name: "notebook",
  viewBox: { minX: 0, minY: 0, width: 200, height: 200 },
  paths: [
    path("notebook", 0, polyline([[40, 20], [170, 20], [170, 180], [40, 180], [40, 20]])),
    path("notebook", 1, polyline([[40, 20], [40, 180]]), { stroke: ACCENT, strokeWidth: 10 }),
    path("notebook", 2, polyline([[65, 70], [150, 70]])),
    path("notebook", 3, polyline([[65, 100], [150, 100]])),
    path("notebook", 4, polyline([[65, 130], [150, 130]])),
  ],
  accentColor: ACCENT,
};

export const person: PlainIllustration = {
  id: "ill_person",
  name: "person",
  viewBox: { minX: 0, minY: 0, width: 120, height: 200 },
  paths: [
    path("person", 0, polyline(arcPoints(60, 40, 20, 0, 360, 20))),
    path("person", 1, polyline([[60, 60], [60, 130]])),
    path("person", 2, polyline([[30, 90], [90, 90]])),
    path("person", 3, polyline([[60, 130], [38, 185]])),
    path("person", 4, polyline([[60, 130], [82, 185]])),
  ],
};

export const lock: PlainIllustration = {
  id: "ill_lock",
  name: "lock",
  viewBox: { minX: 0, minY: 0, width: 160, height: 200 },
  paths: [
    // Shackle: a semicircular arc over the body.
    path("lock", 0, polyline(arcPoints(80, 80, 32, 180, 360, 24))),
    path("lock", 1, polyline([[30, 80], [130, 80], [130, 180], [30, 180], [30, 80]])),
    path("lock", 2, polyline([[80, 115], [80, 145]]), { stroke: ACCENT, strokeWidth: 12 }),
  ],
  accentColor: ACCENT,
};

export const arrow: PlainIllustration = {
  id: "ill_arrow",
  name: "arrow",
  viewBox: { minX: 0, minY: 0, width: 200, height: 60 },
  paths: [
    path("arrow", 0, polyline([[10, 30], [170, 30]])),
    path("arrow", 1, polyline([[170, 30], [148, 14]])),
    path("arrow", 2, polyline([[170, 30], [148, 46]])),
  ],
};

export const sampleIllustrations = [notebook, person, lock, arrow];
