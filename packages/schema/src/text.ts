import { z } from "zod";
import { zTextId } from "./ids";
import { DEFAULT_STROKE_COLOR } from "./constants";
import { zDurationFrames, zFrame, zHexColor } from "./primitives";

/**
 * On-canvas text — captions, titles, labels drawn into a scene.
 *
 * Text lives in canvas coordinates (0..width, 0..height) and is unaffected by
 * the camera (captions stay put while the illustrations move). Position is the
 * anchor point; `align` controls how the string sits around it.
 */
export const TEXT_REVEALS = ["fade", "typewriter", "rise"] as const;
export const zTextReveal = z.enum(TEXT_REVEALS);
export type TextReveal = z.infer<typeof zTextReveal>;

export const TEXT_ALIGNMENTS = ["left", "center", "right"] as const;
export const zTextAlign = z.enum(TEXT_ALIGNMENTS);
export type TextAlign = z.infer<typeof zTextAlign>;

export const zTextElement = z.object({
  id: zTextId,
  content: z.string().min(1),
  /** Anchor position in canvas units. */
  x: z.number(),
  y: z.number(),
  /** Font size in canvas units. */
  fontSize: z.number().positive(),
  fontWeight: z.number().int().min(100).max(900).default(600),
  color: zHexColor.default(DEFAULT_STROKE_COLOR),
  align: zTextAlign.default("center"),
  /** Scene-local frame at which the reveal begins. */
  startFrame: zFrame.default(0),
  revealDurationInFrames: zDurationFrames.default(15),
  reveal: zTextReveal.default("fade"),
});
export type TextElement = z.infer<typeof zTextElement>;
