import type { TextElement } from "@diafram/schema";
import { applyEasing, getRevealProgress } from "@diafram/engine";
import { loadFont } from "@remotion/google-fonts/Caveat";

/**
 * On-canvas text with a timed reveal.
 *
 * Uses Caveat (a marker/handwriting face) so captions match the hand-drawn
 * whiteboard aesthetic. Rendered as SVG `<text>` in canvas coordinates, revealed
 * by fade, rise, or typewriter — all pure functions of the scene-local frame.
 */
const { fontFamily } = loadFont();

const ANCHOR: Record<TextElement["align"], "start" | "middle" | "end"> = {
  left: "start",
  center: "middle",
  right: "end",
};

export type TextElementViewProps = {
  text: TextElement;
  localFrame: number;
};

export function TextElementView({ text, localFrame }: TextElementViewProps) {
  const raw = getRevealProgress(localFrame, text.startFrame, text.revealDurationInFrames);
  const eased = applyEasing("easeOut", raw);

  let opacity = 1;
  let dy = 0;
  let content = text.content;

  switch (text.reveal) {
    case "fade":
      opacity = eased;
      break;
    case "rise":
      opacity = eased;
      dy = (1 - eased) * text.fontSize * 0.4;
      break;
    case "typewriter":
      content = text.content.slice(0, Math.round(raw * text.content.length));
      break;
  }

  return (
    <text
      x={text.x}
      y={text.y + dy}
      textAnchor={ANCHOR[text.align]}
      dominantBaseline="middle"
      fontFamily={fontFamily}
      fontSize={text.fontSize}
      fontWeight={text.fontWeight}
      fill={text.color}
      opacity={opacity}
    >
      {content}
    </text>
  );
}
