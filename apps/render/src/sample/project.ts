import { zVideoProject, type VideoProject } from "@diafram/schema";
import { sampleIllustrations } from "./illustrations";

/**
 * A hand-authored sample explainer: "Explain blockchain to beginners".
 *
 * Four scenes mirroring the product's own storyboard example (notebook →
 * people writing → lock appears → everyone shares). Built as a plain object and
 * validated by `zVideoProject.parse`, so if any invariant is violated this
 * module throws at import time — the sample can never be subtly malformed.
 */
const draft = {
  id: "prj_sample_explainer",
  title: "Explain blockchain to beginners",
  accentColor: "#f97316",
  illustrations: sampleIllustrations,
  scenes: [
    {
      id: "scn_notebook",
      name: "Introduce notebook",
      durationInFrames: 90,
      transitionIn: "fade",
      narration: "Imagine a shared notebook that anyone can write in.",
      camera: {
        keyframes: [
          { frame: 0, x: 0, y: 0, scale: 1, rotation: 0 },
          { frame: 89, x: 0, y: 0, scale: 1.12, rotation: 0 },
        ],
      },
      layers: [
        {
          id: "lyr_notebook",
          illustrationId: "ill_notebook",
          startFrame: 0,
          drawDurationInFrames: 55,
          transform: { x: 610, y: 190, scale: 3.5, rotation: 0 },
          drawOrder: 0,
        },
      ],
    },
    {
      id: "scn_writing",
      name: "People writing",
      durationInFrames: 90,
      transitionIn: "slide",
      narration: "Everyone can add a new entry to the notebook.",
      camera: {
        keyframes: [
          { frame: 0, x: 0, y: 0, scale: 1, rotation: 0 },
          { frame: 89, x: 0, y: 0, scale: 1.05, rotation: 0 },
        ],
      },
      layers: [
        {
          id: "lyr_person_left",
          illustrationId: "ill_person",
          startFrame: 0,
          drawDurationInFrames: 45,
          transform: { x: 430, y: 260, scale: 3, rotation: 0 },
          drawOrder: 0,
        },
        {
          id: "lyr_person_right",
          illustrationId: "ill_person",
          startFrame: 15,
          drawDurationInFrames: 45,
          transform: { x: 1130, y: 260, scale: 3, rotation: 0 },
          drawOrder: 1,
        },
      ],
    },
    {
      id: "scn_lock",
      name: "Lock appears",
      durationInFrames: 90,
      transitionIn: "zoom",
      narration: "Each entry is locked with cryptography, so it can't be changed.",
      camera: {
        keyframes: [
          { frame: 0, x: 0, y: 0, scale: 0.95, rotation: 0 },
          { frame: 45, x: 0, y: 0, scale: 1.15, rotation: 0 },
          { frame: 89, x: 0, y: 0, scale: 1.15, rotation: 0 },
        ],
      },
      layers: [
        {
          id: "lyr_lock",
          illustrationId: "ill_lock",
          startFrame: 0,
          drawDurationInFrames: 50,
          transform: { x: 640, y: 150, scale: 4, rotation: 0 },
          drawOrder: 0,
        },
      ],
    },
    {
      id: "scn_share",
      name: "Everyone shares notebook",
      durationInFrames: 90,
      transitionIn: "fade",
      narration: "And everyone shares the exact same copy. That's a blockchain.",
      camera: {
        keyframes: [
          { frame: 0, x: 0, y: 0, scale: 1.1, rotation: 0 },
          { frame: 89, x: 0, y: 0, scale: 1, rotation: 0 },
        ],
      },
      layers: [
        {
          id: "lyr_share_notebook",
          illustrationId: "ill_notebook",
          startFrame: 0,
          drawDurationInFrames: 40,
          transform: { x: 760, y: 340, scale: 2, rotation: 0 },
          drawOrder: 2,
        },
        {
          id: "lyr_share_person_left",
          illustrationId: "ill_person",
          startFrame: 20,
          drawDurationInFrames: 30,
          transform: { x: 300, y: 360, scale: 2, rotation: 0 },
          drawOrder: 0,
        },
        {
          id: "lyr_share_person_right",
          illustrationId: "ill_person",
          startFrame: 20,
          drawDurationInFrames: 30,
          transform: { x: 1380, y: 360, scale: 2, rotation: 0 },
          drawOrder: 0,
        },
        {
          id: "lyr_share_arrow_left",
          illustrationId: "ill_arrow",
          startFrame: 45,
          drawDurationInFrames: 20,
          transform: { x: 720, y: 520, scale: 1.5, rotation: 180 },
          drawOrder: 1,
        },
        {
          id: "lyr_share_arrow_right",
          illustrationId: "ill_arrow",
          startFrame: 45,
          drawDurationInFrames: 20,
          transform: { x: 1200, y: 520, scale: 1.5, rotation: 0 },
          drawOrder: 1,
        },
      ],
    },
  ],
};

export const sampleProject: VideoProject = zVideoProject.parse(draft);
