import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { VideoProject } from "@diafram/schema";
import { renderProjectToFile } from "./render";

/**
 * Render backends. Both satisfy `RenderBackend`, so the worker is agnostic to
 * where rendering actually happens — local Chromium today, Remotion Lambda in
 * production. The output target (`RENDER_BACKEND`) is an env switch.
 */
export interface RenderRequest {
  project: VideoProject;
  frameRange?: [number, number];
}

export interface RenderBackend {
  render(
    jobId: string,
    request: RenderRequest,
    onProgress: (progress: number) => void,
  ): Promise<{ outputPath: string }>;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(HERE, "..", "..", "out", "renders");

/** Renders on the local machine with headless Chromium. */
export class LocalRenderBackend implements RenderBackend {
  async render(
    jobId: string,
    request: RenderRequest,
    onProgress: (progress: number) => void,
  ): Promise<{ outputPath: string }> {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    const outputPath = join(OUTPUT_DIR, `${jobId}.mp4`);
    await renderProjectToFile({
      project: request.project,
      outputPath,
      frameRange: request.frameRange,
      onProgress,
    });
    return { outputPath };
  }
}

/**
 * Production backend: Remotion Lambda. Left as a guarded stub so this module has
 * no hard dependency on a deployed function or AWS creds — it throws a clear
 * error until the function + site are deployed and configured.
 */
export class LambdaRenderBackend implements RenderBackend {
  async render(): Promise<{ outputPath: string }> {
    throw new Error(
      "Lambda backend not configured. Deploy the Remotion Lambda function and site, " +
        "then set REMOTION_APP_FUNCTION_NAME / REMOTION_APP_SERVE_URL / AWS credentials.",
    );
  }
}

/** Select the backend from the environment (defaults to local). */
export function resolveBackend(): RenderBackend {
  return process.env.RENDER_BACKEND === "lambda"
    ? new LambdaRenderBackend()
    : new LocalRenderBackend();
}
