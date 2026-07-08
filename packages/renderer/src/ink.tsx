import type { ViewBox } from "@diafram/schema";
import { hashString, PAPER_SHADOW, roughenParams, ROUGHEN } from "./style";

/**
 * SVG ink filters — the "drawn on paper" look.
 *
 * Two deterministic, static filters (no per-frame animation, so nothing
 * "boils"): a turbulence displacement that roughens stroke edges into a
 * pencil/marker wobble, and a soft paper contact shadow. Both render identically
 * in the browser preview and in headless Chromium.
 *
 * Filter ids are derived from the illustration id so each icon gets its own
 * turbulence seed (varied wobble) without id collisions across a scene.
 */

/** Stable filter id for an illustration's edge-roughening filter. */
export function roughenFilterId(illustrationId: string): string {
  return `roughen-${illustrationId}`;
}

/** Stable filter id for the shared soft paper shadow. */
export const PAPER_SHADOW_ID = "paper-shadow";

/**
 * Per-illustration edge-roughening filter. `feTurbulence` is seeded from the
 * illustration id so different icons wobble differently but reproducibly. The
 * displacement scale and noise frequency are derived from the illustration's
 * viewBox diagonal, so the wobble looks the same "amount" regardless of the
 * icon's coordinate space.
 */
export function RoughenFilter({
  illustrationId,
  viewBox,
}: {
  illustrationId: string;
  viewBox: ViewBox;
}) {
  const seed = hashString(illustrationId);
  const diagonal = Math.sqrt(viewBox.width ** 2 + viewBox.height ** 2);
  const { baseFrequency, scale } = roughenParams(diagonal);
  return (
    <filter
      id={roughenFilterId(illustrationId)}
      filterUnits="objectBoundingBox"
      x="-20%"
      y="-20%"
      width="140%"
      height="140%"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency={baseFrequency}
        numOctaves={ROUGHEN.numOctaves}
        seed={seed}
        result="noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  );
}

/** Shared soft contact shadow, so illustrations sit on the surface. */
export function PaperShadowFilter() {
  return (
    <filter id={PAPER_SHADOW_ID} filterUnits="objectBoundingBox" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow
        dx={PAPER_SHADOW.dx}
        dy={PAPER_SHADOW.dy}
        stdDeviation={PAPER_SHADOW.stdDeviation}
        floodColor={PAPER_SHADOW.color}
        floodOpacity={PAPER_SHADOW.opacity}
      />
    </filter>
  );
}
