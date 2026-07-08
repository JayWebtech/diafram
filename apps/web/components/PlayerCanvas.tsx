"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { VideoComposition, getCompositionMetadata } from "@diafram/renderer";
import type { VideoProject } from "@diafram/schema";

/**
 * The live preview — the SAME `VideoComposition` the render worker uses, mounted
 * in `@remotion/player`. Rendering is gated until the component is mounted on the
 * client so the Player never runs during SSR.
 */
export type PlayerCanvasProps = {
  project: VideoProject;
  /** Receives the Player instance so parents can drive seeking. */
  register?: (player: PlayerRef | null) => void;
  /** Called on every frame with the current global frame. */
  onFrame?: (frame: number) => void;
};

export function PlayerCanvas({ project, register, onFrame }: PlayerCanvasProps) {
  const ref = useRef<PlayerRef>(null);
  const [mounted, setMounted] = useState(false);

  // Give every audio source its own dedicated <audio> tag so the Player never
  // recycles a shared tag mid-session. Recycling a tag onto another scene's
  // narration data-URI is what makes the preview crackle and double up — the
  // downloaded render is unaffected since it mixes audio deterministically.
  const audioTagCount = useMemo(() => {
    const narrated = project.scenes.filter((scene) => scene.narrationAudioUrl).length;
    const music = project.backgroundMusic ? 1 : 0;
    return Math.max(1, narrated + music);
  }, [project.scenes, project.backgroundMusic]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const player = ref.current;
    register?.(player);
    if (!player) return;
    const handle = (e: { detail: { frame: number } }) => onFrame?.(e.detail.frame);
    player.addEventListener("frameupdate", handle);
    return () => {
      player.removeEventListener("frameupdate", handle);
      register?.(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, project]);

  if (!mounted) {
    return <div className="aspect-video w-full rounded-xl border border-border bg-white/95" />;
  }

  const meta = getCompositionMetadata(project);
  return (
    <Player
      ref={ref}
      component={VideoComposition}
      inputProps={{ project }}
      durationInFrames={meta.durationInFrames}
      fps={meta.fps}
      compositionWidth={meta.width}
      compositionHeight={meta.height}
      numberOfSharedAudioTags={audioTagCount}
      controls
      loop
      style={{
        width: "100%",
        aspectRatio: `${meta.width} / ${meta.height}`,
        borderRadius: "0.75rem",
        overflow: "hidden",
        border: "1px solid var(--color-border)",
        background: "#ffffff",
      }}
    />
  );
}
