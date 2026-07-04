import type { Illustration, Storyboard, VideoProject } from "@diafram/schema";
import { generateStoryboard } from "./agents/storyboard";
import { compileProject } from "./compile/structure";
import { illustrationHash } from "./hash";
import { createDefaultIllustrationSource } from "./illustration/default";
import type { IllustrationSource } from "./illustration/source";
import type { IllustrationLibrary } from "./library";
import { InMemoryIllustrationLibrary } from "./library";
import type { LlmPort } from "./llm/port";

/**
 * The end-to-end generation pipeline: prompt → storyboard → artwork → project.
 *
 * Illustrations come from an `IllustrationSource` (default: curated library →
 * LLM fallback) and are deduped through the reuse cache keyed by brief hash, so
 * a brief appearing in multiple scenes is only resolved once. The steps stay
 * separately callable so the editor can drive them with a human checkpoint after
 * the storyboard.
 */

export interface GeneratePipelineOptions {
  llm: LlmPort;
  /** Override the art source (default: library + LLM fallback). */
  source?: IllustrationSource;
  /** Reuse cache keyed by brief hash. */
  library?: IllustrationLibrary;
  prompt: string;
  audience?: string;
  accentColor?: string | null;
}

export interface GenerateResult {
  storyboard: Storyboard;
  project: VideoProject;
}

export async function generateVideoProject(
  options: GeneratePipelineOptions,
): Promise<GenerateResult> {
  const storyboard = await generateStoryboard(options.llm, {
    prompt: options.prompt,
    audience: options.audience,
  });

  const project = await generateProjectFromStoryboard({
    llm: options.llm,
    source: options.source,
    library: options.library,
    storyboard,
    title: options.prompt,
    accentColor: options.accentColor ?? null,
  });

  return { storyboard, project };
}

export interface ProjectFromStoryboardOptions {
  llm: LlmPort;
  source?: IllustrationSource;
  library?: IllustrationLibrary;
  /** An approved (possibly human-edited) storyboard. */
  storyboard: Storyboard;
  title: string;
  accentColor?: string | null;
}

/**
 * Steps 2 & 3 only: resolve artwork for an approved storyboard and compile it
 * into a project — the path the editor takes after the storyboard checkpoint.
 */
export async function generateProjectFromStoryboard(
  options: ProjectFromStoryboardOptions,
): Promise<VideoProject> {
  const source = options.source ?? (await createDefaultIllustrationSource(options.llm));
  const reuseCache = options.library ?? new InMemoryIllustrationLibrary();
  const accentColor = options.accentColor ?? null;

  const sceneIllustrations = await resolveIllustrations(
    source,
    reuseCache,
    options.storyboard,
    accentColor,
  );

  return compileProject({
    storyboard: options.storyboard,
    title: options.title,
    sceneIllustrations,
    accentColor,
  });
}

/**
 * Resolve every scene's illustration briefs, consulting (and populating) the
 * reuse cache so identical briefs share one illustration.
 */
async function resolveIllustrations(
  source: IllustrationSource,
  reuseCache: IllustrationLibrary,
  storyboard: Storyboard,
  accentColor: string | null,
): Promise<Illustration[][]> {
  // Within-run cache so a brief repeated across scenes doesn't race two resolves.
  const inFlight = new Map<string, Promise<Illustration>>();

  const resolveBrief = (brief: string): Promise<Illustration> => {
    const hash = illustrationHash(brief, accentColor);
    const existing = inFlight.get(hash);
    if (existing) return existing;

    const task = (async () => {
      const cached = await reuseCache.get(hash);
      if (cached) return cached;

      const illustration = await source.resolve({ brief, accentColor });
      if (!illustration) {
        throw new Error(`No illustration source could satisfy brief: "${brief}"`);
      }

      const stored = { ...illustration, promptHash: hash };
      await reuseCache.put(hash, stored);
      return stored;
    })();

    inFlight.set(hash, task);
    return task;
  };

  return Promise.all(
    storyboard.scenes.map((scene) => Promise.all(scene.illustrationBriefs.map(resolveBrief))),
  );
}
