import type { VideoCompositionProps } from "@diafram/renderer";
import { VideoComposition, getCompositionMetadata } from "@diafram/renderer";
import { zVideoProject } from "@diafram/schema";
import { Composition } from "remotion";
import { sampleProject } from "./sample/project";
import generatedJson from "./generated/project.json";

/**
 * The Remotion root. Registers two compositions off the shared
 * `VideoComposition`, both sized from their project via `calculateMetadata`:
 *  - "Explainer": the hand-authored sample.
 *  - "Generated": whatever the AI pipeline last wrote to generated/project.json.
 */

// Validate the generated JSON through the schema so a malformed pipeline output
// fails loudly at load rather than rendering garbage.
const generatedProject = zVideoProject.parse(generatedJson);

export function RemotionRoot() {
  const sampleMeta = getCompositionMetadata(sampleProject);
  const generatedMeta = getCompositionMetadata(generatedProject);

  return (
    <>
      <Composition
        id="Explainer"
        component={VideoComposition}
        durationInFrames={sampleMeta.durationInFrames}
        fps={sampleMeta.fps}
        width={sampleMeta.width}
        height={sampleMeta.height}
        defaultProps={{ project: sampleProject, background: "#ffffff" } satisfies VideoCompositionProps}
        calculateMetadata={({ props }) => getCompositionMetadata(props.project)}
      />
      <Composition
        id="Generated"
        component={VideoComposition}
        durationInFrames={generatedMeta.durationInFrames}
        fps={generatedMeta.fps}
        width={generatedMeta.width}
        height={generatedMeta.height}
        defaultProps={{ project: generatedProject, background: "#ffffff" } satisfies VideoCompositionProps}
        calculateMetadata={({ props }) => getCompositionMetadata(props.project)}
      />
    </>
  );
}
