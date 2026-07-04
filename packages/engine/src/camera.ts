import type { CameraTrack, Transform } from "@diafram/schema";
import { interpolate } from "./interpolate";
import { valueNoise1D } from "./rng";

/**
 * Resolve the camera transform for a given scene-local frame.
 *
 * The keyframe track is interpolated channel-by-channel (x, y, scale, rotation),
 * using the easing declared on the keyframe being approached. Outside the track
 * the camera holds the first/last keyframe. Deterministic shake, if configured,
 * is added on top of the interpolated translation.
 *
 * Pure and total: any finite `localFrame` yields a transform.
 */
export function getCameraTransform(
  track: CameraTrack,
  localFrame: number,
  fps: number,
): Transform {
  const { keyframes, shake } = track;
  const first = keyframes[0]!;
  const last = keyframes[keyframes.length - 1]!;

  let base: Transform;

  if (localFrame <= first.frame) {
    base = toTransform(first);
  } else if (localFrame >= last.frame) {
    base = toTransform(last);
  } else {
    base = toTransform(first);
    // Find the segment [a, b] containing localFrame and interpolate across it.
    for (let i = 0; i < keyframes.length - 1; i++) {
      const a = keyframes[i]!;
      const b = keyframes[i + 1]!;
      if (localFrame >= a.frame && localFrame < b.frame) {
        const range = [a.frame, b.frame] as const;
        base = {
          x: interpolate(localFrame, range, [a.x, b.x], { easing: b.easing }),
          y: interpolate(localFrame, range, [a.y, b.y], { easing: b.easing }),
          scale: interpolate(localFrame, range, [a.scale, b.scale], { easing: b.easing }),
          rotation: interpolate(localFrame, range, [a.rotation, b.rotation], { easing: b.easing }),
        };
        break;
      }
    }
  }

  if (!shake || shake.amplitude === 0) return base;

  // Shake is a smooth noise signal sampled in seconds so `frequency` reads as
  // oscillations per second regardless of fps. X and Y use decorrelated seeds.
  const timeSeconds = localFrame / fps;
  const phase = timeSeconds * shake.frequency;
  const dx = shake.amplitude * valueNoise1D(phase, shake.seed);
  const dy = shake.amplitude * valueNoise1D(phase, shake.seed + 1);

  return { ...base, x: base.x + dx, y: base.y + dy };
}

function toTransform(kf: { x: number; y: number; scale: number; rotation: number }): Transform {
  return { x: kf.x, y: kf.y, scale: kf.scale, rotation: kf.rotation };
}
