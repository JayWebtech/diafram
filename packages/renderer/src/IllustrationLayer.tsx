import type { DrawablePath, Illustration, Layer } from "@diafram/schema";
import { getIllustrationDrawState } from "@diafram/engine";
import { useCurrentFrame } from "remotion";
import { DrawPath } from "./DrawPath";
import { layerTransformString } from "./geometry";

/**
 * Renders one illustration placed by one layer, drawing it stroke-by-stroke.
 *
 * Must be mounted inside the scene's `<Sequence>` so `useCurrentFrame()` yields
 * the scene-local frame the draw engine expects. The layer transform positions
 * the illustration on the canvas; strokes are painted in draw order.
 */
export type IllustrationLayerProps = {
  illustration: Illustration;
  layer: Layer;
};

export function IllustrationLayer({ illustration, layer }: IllustrationLayerProps) {
  const localFrame = useCurrentFrame();
  const drawState = getIllustrationDrawState(illustration, layer, localFrame);

  // Index path metadata by id so we can render in draw order while pulling the
  // geometry (d, stroke, fill) for each path.
  const pathsById = new Map<string, DrawablePath>(
    illustration.paths.map((path) => [path.id, path]),
  );

  return (
    <g
      transform={layerTransformString(layer.transform, illustration.viewBox)}
      opacity={layer.opacity}
    >
      {drawState.paths.map((state) => {
        const path = pathsById.get(state.id);
        if (!path) return null;
        return <DrawPath key={state.id} path={path} state={state} />;
      })}
    </g>
  );
}
