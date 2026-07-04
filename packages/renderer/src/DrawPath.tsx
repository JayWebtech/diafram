import type { DrawablePath } from "@diafram/schema";
import type { PathDrawState } from "@diafram/engine";

/**
 * A single self-drawing stroke.
 *
 * The reveal is done purely with `stroke-dasharray`/`stroke-dashoffset` fed from
 * the engine's precomputed values — no opacity fade, no `getTotalLength()`. An
 * optional fill is applied only once the outline is fully drawn, so shapes are
 * always inked before they are filled.
 */
export type DrawPathProps = {
  path: DrawablePath;
  state: PathDrawState;
};

export function DrawPath({ path, state }: DrawPathProps) {
  const filled = state.progress >= 1 && path.fill !== null;

  return (
    <path
      d={path.d}
      fill={filled ? path.fill! : "none"}
      stroke={path.stroke}
      strokeWidth={path.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={state.dashArray}
      strokeDashoffset={state.dashOffset}
    />
  );
}
