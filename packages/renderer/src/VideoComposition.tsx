import type { Illustration, VideoProject } from "@diafram/schema";
import { compileTimeline } from "@diafram/engine";
import { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence } from "remotion";
import { SceneRenderer } from "./SceneRenderer";

/**
 * The top-level composition — the single component that both the browser
 * `@remotion/player` preview and the headless render worker mount.
 *
 * It compiles the project's timeline once, then lays each scene onto the global
 * timeline as a premounted `<Sequence>`. Because `useCurrentFrame()` is
 * scene-local inside a `<Sequence>`, everything below here works in scene-local
 * frames without any manual offset math.
 */
export type VideoCompositionProps = {
  project: VideoProject;
  /** The whiteboard surface color. */
  background?: string;
};

export function VideoComposition({ project, background = "#ffffff" }: VideoCompositionProps) {
  const timeline = useMemo(() => compileTimeline(project), [project]);
  const illustrations = useMemo(
    () => new Map<string, Illustration>(project.illustrations.map((ill) => [ill.id, ill])),
    [project.illustrations],
  );

  // Premount each scene a little ahead so nothing pops in un-warmed.
  const premountFor = project.fps;

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      {project.backgroundMusic ? (
        <Audio
          loop
          src={project.backgroundMusic.url}
          volume={project.backgroundMusic.volume}
        />
      ) : null}
      {timeline.scenes.map((compiled) => (
        <Sequence
          key={compiled.scene.id}
          from={compiled.startFrame}
          durationInFrames={compiled.durationInFrames}
          premountFor={premountFor}
        >
          {compiled.scene.narrationAudioUrl ? (
            <Audio src={compiled.scene.narrationAudioUrl} />
          ) : null}
          <SceneRenderer
            scene={compiled.scene}
            illustrations={illustrations}
            width={project.width}
            height={project.height}
            fps={project.fps}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

export interface CompositionMetadata {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

/**
 * Derive the Remotion composition metadata from a project — used to register the
 * `<Composition>` in the render worker and to size the `<Player>` in the editor.
 */
export function getCompositionMetadata(project: VideoProject): CompositionMetadata {
  const timeline = compileTimeline(project);
  return {
    // A composition needs at least one frame even if the project is somehow empty.
    durationInFrames: Math.max(1, timeline.durationInFrames),
    fps: project.fps,
    width: project.width,
    height: project.height,
  };
}
