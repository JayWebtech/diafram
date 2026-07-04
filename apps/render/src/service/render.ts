import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import type { VideoProject } from "@diafram/schema";

/**
 * Local MP4 rendering via `@remotion/renderer`.
 *
 * This is the "local" render backend: it bundles the Remotion project once,
 * selects the shared `VideoComposition` (the same one the editor previews), and
 * renders it to an H.264 MP4. The production backend (`@remotion/lambda`) plugs
 * in behind the same `RenderBackend` interface without changing callers.
 */

const COMPOSITION_ID = "Generated";
const HERE = dirname(fileURLToPath(import.meta.url));
/** The Remotion entry (registerRoot) lives two levels up from src/service. */
const ENTRY_POINT = join(HERE, "..", "index.ts");

let bundlePromise: Promise<string> | null = null;

/** Bundle the Remotion project once and reuse the serve URL across renders. */
function getServeUrl(): Promise<string> {
  bundlePromise ??= bundle({ entryPoint: ENTRY_POINT });
  return bundlePromise;
}

export interface RenderOptions {
  project: VideoProject;
  outputPath: string;
  /** Optional inclusive-start/exclusive-end frame window (for quick previews/tests). */
  frameRange?: [number, number];
  /** 0..1 progress callback. */
  onProgress?: (progress: number) => void;
}

export async function renderProjectToFile(options: RenderOptions): Promise<string> {
  await ensureBrowser();
  const serveUrl = await getServeUrl();

  const inputProps = { project: options.project, background: "#ffffff" };

  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: options.outputPath,
    inputProps,
    frameRange: options.frameRange,
    onProgress: ({ progress }) => options.onProgress?.(progress),
  });

  return options.outputPath;
}
