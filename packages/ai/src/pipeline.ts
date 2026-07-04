import type { Illustration, Storyboard, VideoProject } from "@diafram/schema";
import { generateIllustration } from "./agents/artist";
import { generateStoryboard } from "./agents/storyboard";
import { compileProject } from "./compile/structure";
import { illustrationHash } from "./hash";
import type { IllustrationLibrary } from "./library";
import { InMemoryIllustrationLibrary } from "./library";
import type { LlmPort } from "./llm/port";

/**
 * The end-to-end generation pipeline: prompt → storyboard → artwork → project.
 *
 * Illustrations are resolved through the reuse library keyed by brief hash, so a
 * brief that appears in multiple scenes is only ever drawn once. The steps are
 * kept as separate exported agents (`generateStoryboard`, `generateIllustration`,
 * `compileProject`) so the editor can also drive them individually with a human
 * checkpoint after the storyboard.
 */

export interface GeneratePipelineOptions {
  llm: LlmPort;
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
    library: options.library,
    storyboard,
    title: options.prompt,
    accentColor: options.accentColor ?? null,
  });

  return { storyboard, project };
}

export interface ProjectFromStoryboardOptions {
  llm: LlmPort;
  library?: IllustrationLibrary;
  /** An approved (possibly human-edited) storyboard. */
  storyboard: Storyboard;
  title: string;
  accentColor?: string | null;
}

/**
 * Steps 2 & 3 only: generate artwork for an already-approved storyboard and
 * compile it into a project. This is the path the editor takes after the user
 * reviews and edits the storyboard, keeping the Step-1 human checkpoint intact.
 */
export async function generateProjectFromStoryboard(
  options: ProjectFromStoryboardOptions,
): Promise<VideoProject> {
  const library = options.library ?? new InMemoryIllustrationLibrary();
  const accentColor = options.accentColor ?? null;

  const sceneIllustrations = await resolveIllustrations(
    options.llm,
    library,
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
 * Resolve every scene's illustration briefs into illustrations, consulting (and
 * populating) the reuse library so identical briefs share one drawing.
 */
async function resolveIllustrations(
  llm: LlmPort,
  library: IllustrationLibrary,
  storyboard: Storyboard,
  accentColor: string | null,
): Promise<Illustration[][]> {
  // Cache within this run too, so a brief repeated in the same project doesn't
  // race two generations before the library is populated.
  const inFlight = new Map<string, Promise<Illustration>>();

  const resolveBrief = (brief: string): Promise<Illustration> => {
    const hash = illustrationHash(brief, accentColor);
    const existing = inFlight.get(hash);
    if (existing) return existing;

    const task = (async () => {
      const cached = await library.get(hash);
      if (cached) return cached;
      const illustration = await generateIllustration(llm, {
        brief,
        accentColor,
        promptHash: hash,
      });
      await library.put(hash, illustration);
      return illustration;
    })();

    inFlight.set(hash, task);
    return task;
  };

  return Promise.all(
    storyboard.scenes.map((scene) => Promise.all(scene.illustrationBriefs.map(resolveBrief))),
  );
}
