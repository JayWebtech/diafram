import type { Illustration, Scene } from "@diafram/schema";
import { getCameraTransform } from "@diafram/engine";
import { useCurrentFrame } from "remotion";
import { cameraTransformString } from "./geometry";
import { getSceneIntroStyle } from "./transitions";
import { IllustrationLayer } from "./IllustrationLayer";
import { TextElementView } from "./TextElement";

/**
 * Renders a single scene: the camera move, the intro transition, and every
 * layer's illustration for the current scene-local frame.
 *
 * One scene is on screen at a time, so each renders its own full-canvas `<svg>`.
 * Layers are painted in ascending `drawOrder` (higher on top).
 */
export type SceneRendererProps = {
  scene: Scene;
  /** Illustrations resolved from the project, keyed by id. */
  illustrations: Map<string, Illustration>;
  width: number;
  height: number;
  fps: number;
};

export function SceneRenderer({ scene, illustrations, width, height, fps }: SceneRendererProps) {
  const localFrame = useCurrentFrame();

  const camera = getCameraTransform(scene.camera, localFrame, fps);
  const intro = getSceneIntroStyle(scene.transitionIn, localFrame, fps, width, height);

  const orderedLayers = [...scene.layers].sort((a, b) => a.drawOrder - b.drawOrder);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <g opacity={intro.opacity} transform={intro.transform || undefined}>
        <g transform={cameraTransformString(camera, width, height)}>
          {orderedLayers.map((layer) => {
            const illustration = illustrations.get(layer.illustrationId);
            if (!illustration) return null;
            return (
              <IllustrationLayer key={layer.id} illustration={illustration} layer={layer} />
            );
          })}
        </g>

        {/* Text sits in canvas space, above the camera group (unaffected by camera). */}
        {scene.texts.map((text) => (
          <TextElementView key={text.id} text={text} localFrame={localFrame} />
        ))}
      </g>
    </svg>
  );
}
