import type { DrawablePath, Illustration, Layer } from "@diafram/schema";
import { viewBoxToString } from "@diafram/schema";
import { applyEasing, getActivePath, getIllustrationDrawState, getLayerDrawProgress } from "@diafram/engine";
import { useCurrentFrame } from "remotion";
import { DrawPath } from "./DrawPath";
import { PenTip } from "./PenTip";
import { PaperShadowFilter, PAPER_SHADOW_ID, RoughenFilter, roughenFilterId } from "./ink";
import { layerTransformString, markupTransformString } from "./geometry";

/**
 * Renders one illustration placed by one layer.
 *
 * Two reveal modes:
 *  - stroke (line art): drawn stroke-by-stroke via stroke-dash.
 *  - wipe (filled markup, e.g. hand-drawn people): the whole artwork is rendered
 *    and revealed left-to-right by an animated clip — the equivalent of a hand
 *    dragging the image into view.
 *
 * Must be mounted inside the scene's `<Sequence>` so `useCurrentFrame()` yields
 * the scene-local frame.
 */
export type IllustrationLayerProps = {
  illustration: Illustration;
  layer: Layer;
};

export function IllustrationLayer({ illustration, layer }: IllustrationLayerProps) {
  const localFrame = useCurrentFrame();

  if (illustration.markup || illustration.reveal === "wipe") {
    return <WipeIllustration illustration={illustration} layer={layer} localFrame={localFrame} />;
  }
  return <StrokeIllustration illustration={illustration} layer={layer} localFrame={localFrame} />;
}

/** Line-art: reveal each path with stroke-dash, in draw order. */
function StrokeIllustration({
  illustration,
  layer,
  localFrame,
}: IllustrationLayerProps & { localFrame: number }) {
  const drawState = getIllustrationDrawState(illustration, layer, localFrame);
  const pathsById = new Map<string, DrawablePath>(
    illustration.paths.map((path) => [path.id, path]),
  );

  // The stroke currently under the pen (null before/after drawing) → nib position.
  const active = getActivePath(drawState);
  const activePath = active ? pathsById.get(active.id) : undefined;

  return (
    <g
      transform={layerTransformString(layer.transform, illustration.viewBox)}
      opacity={layer.opacity}
    >
      <defs>
        <RoughenFilter illustrationId={illustration.id} viewBox={illustration.viewBox} />
        <PaperShadowFilter />
      </defs>
      {/* Roughened, softly-shadowed ink. Filters are static + deterministic. */}
      <g filter={`url(#${roughenFilterId(illustration.id)})`}>
        <g filter={`url(#${PAPER_SHADOW_ID})`}>
          {drawState.paths.map((state) => {
            const path = pathsById.get(state.id);
            if (!path) return null;
            return <DrawPath key={state.id} path={path} state={state} />;
          })}
        </g>
      </g>
      {/* The pen tip sits above the ink, unroughened, at the live drawing head. */}
      {active && activePath ? <PenTip path={activePath} state={active} /> : null}
    </g>
  );
}

/** Filled artwork: render whole, reveal by a growing horizontal clip. */
function WipeIllustration({
  illustration,
  layer,
  localFrame,
}: IllustrationLayerProps & { localFrame: number }) {
  const { viewBox } = illustration;
  const progress = applyEasing("easeInOut", getLayerDrawProgress(layer, localFrame));
  const clipId = `wipe-${layer.id}`;
  const revealWidth = viewBox.width * progress;
  const isMarkup = Boolean(illustration.markup);

  // A markup illustration is a nested <svg> anchored at (0,0); a path illustration
  // lives in its own viewBox coordinates. The clip origin follows suit.
  const transform = isMarkup
    ? markupTransformString(layer.transform)
    : layerTransformString(layer.transform, viewBox);
  const clipX = isMarkup ? 0 : viewBox.minX;
  const clipY = isMarkup ? 0 : viewBox.minY;

  return (
    <g transform={transform} opacity={layer.opacity}>
      <defs>
        <PaperShadowFilter />
        <clipPath id={clipId}>
          <rect x={clipX} y={clipY} width={revealWidth} height={viewBox.height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} filter={`url(#${PAPER_SHADOW_ID})`}>
        {isMarkup ? (
          <svg
            width={viewBox.width}
            height={viewBox.height}
            viewBox={viewBoxToString(viewBox)}
            xmlns="http://www.w3.org/2000/svg"
            dangerouslySetInnerHTML={{ __html: illustration.markup! }}
          />
        ) : (
          illustration.paths.map((path) => (
            <path
              key={path.id}
              d={path.d}
              fill={path.fill ?? "none"}
              stroke={path.stroke}
              strokeWidth={path.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))
        )}
      </g>
    </g>
  );
}
