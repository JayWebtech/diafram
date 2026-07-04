import { zVideoProject } from "@diafram/schema";
import { describe, expect, it } from "vitest";
import { generateIllustration } from "./agents/artist";
import { LlmIllustrationSource } from "./illustration/source";
import { FakeLlm } from "./llm/fake";
import { generateVideoProject } from "./pipeline";

const SQUARE = `<svg viewBox="0 0 100 100"><path d="M10 10 L90 10 L90 90 L10 90 Z" stroke="#111111" stroke-width="8" fill="none"/></svg>`;
// A genuinely invalid SVG (disallowed <text> element) to trigger the repair loop.
const BAD = `<svg viewBox="0 0 10 10"><text x="0" y="5">nope</text></svg>`;

const STORYBOARD_DRAFT = {
  audience: "beginners",
  scenes: [
    {
      title: "Lock it",
      narration: "Each entry is locked.",
      visualDescription: "A padlock closes over a note.",
      durationSeconds: 6,
      cameraIntent: "zoom" as const,
      illustrationBriefs: ["padlock"],
      transition: "fade" as const,
    },
    {
      title: "Share it",
      narration: "Everyone shares the same locked notebook.",
      visualDescription: "A notebook next to a padlock.",
      durationSeconds: 8,
      cameraIntent: "static" as const,
      illustrationBriefs: ["padlock", "notebook"],
      transition: "cut" as const,
    },
  ],
};

describe("artist repair loop", () => {
  it("re-prompts after invalid SVG and succeeds", async () => {
    const llm = new FakeLlm().queueText(BAD, SQUARE);
    const illustration = await generateIllustration(llm, { brief: "padlock" });
    expect(llm.textCalls).toBe(2);
    expect(illustration.name).toBe("padlock");
    expect(illustration.paths[0]!.length).toBeGreaterThan(0);
  });
});

describe("generateVideoProject", () => {
  it("produces a valid project and reuses repeated illustrations", async () => {
    const llm = new FakeLlm()
      .queueObject(STORYBOARD_DRAFT)
      // Two unique briefs across the storyboard: padlock, notebook.
      .queueText(SQUARE, SQUARE);

    // Force the LLM source (bypass the library) to test generation + reuse dedup.
    const { storyboard, project } = await generateVideoProject({
      llm,
      source: new LlmIllustrationSource(llm),
      prompt: "Explain blockchain",
    });

    // Storyboard was structured and validated.
    expect(storyboard.scenes).toHaveLength(2);

    // "padlock" appears in both scenes but is only drawn once.
    expect(llm.textCalls).toBe(2);

    // The compiled project is schema-valid and self-contained.
    expect(zVideoProject.safeParse(project).success).toBe(true);
    expect(project.illustrations).toHaveLength(2);
    expect(project.scenes[0]!.layers).toHaveLength(1);
    expect(project.scenes[1]!.layers).toHaveLength(2);

    // Seconds were converted to frames (8s * 30fps).
    expect(project.scenes[1]!.durationInFrames).toBe(240);

    // Both layers in scene 2 reference embedded illustrations.
    const ids = new Set(project.illustrations.map((i) => i.id));
    for (const layer of project.scenes[1]!.layers) {
      expect(ids.has(layer.illustrationId)).toBe(true);
    }
  });
});
