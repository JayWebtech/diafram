import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync } from "node:fs";
import { projectDurationInFrames } from "@diafram/schema";
import { createLlmPort, resolvePlatform } from "../src/llm/factory";
import { generateVideoProject } from "../src/pipeline";
import { loadEnv } from "./env";

/**
 * Live end-to-end generation: prompt → configured provider → validated
 * VideoProject, written to the render app's generated/project.json.
 * Run: `pnpm --filter @diafram/ai generate "<prompt>"`.
 */
async function main() {
  const prompt = process.argv[2] ?? "Explain blockchain to beginners";
  const env = loadEnv();
  const llm = createLlmPort(env);

  console.log(`→ generating full project (${resolvePlatform(env)}) for: "${prompt}"`);
  const start = Date.now();
  const { storyboard, project } = await generateVideoProject({
    llm,
    prompt,
    accentColor: "#f97316",
  });

  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = join(here, "..", "..", "..", "apps", "render", "src", "generated", "project.json");
  writeFileSync(outPath, JSON.stringify(project, null, 2));

  const secs = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `✓ ${storyboard.scenes.length} scenes, ${project.illustrations.length} unique illustrations, ${projectDurationInFrames(project)} frames (${secs}s)`,
  );
  console.log(`✓ wrote ${outPath}`);
}

main().catch((err) => {
  console.error("Generation failed:", err);
  process.exit(1);
});
