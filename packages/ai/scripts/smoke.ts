import { createLlmPort, resolvePlatform } from "../src/llm/factory";
import { generateStoryboard } from "../src/agents/storyboard";
import { generateIllustration } from "../src/agents/artist";
import { loadEnv } from "./env";

/**
 * Live smoke test against the configured provider (PLATFORM in .env). NOT part
 * of the test suite (needs a key + network). Run: `pnpm --filter @diafram/ai smoke`.
 */
async function main() {
  const env = loadEnv();
  const llm = createLlmPort(env);
  console.log(`provider: ${resolvePlatform(env)}`);

  console.log("→ generating storyboard...");
  const storyboard = await generateStoryboard(llm, {
    prompt: "Explain blockchain to beginners",
  });
  console.log(`✓ ${storyboard.scenes.length} scenes:`);
  for (const scene of storyboard.scenes) {
    console.log(`  ${scene.index + 1}. ${scene.title}  [${scene.cameraIntent}]  ${JSON.stringify(scene.illustrationBriefs)}`);
  }

  const firstBrief = storyboard.scenes[0]?.illustrationBriefs[0];
  if (firstBrief) {
    console.log(`→ generating illustration for "${firstBrief}"...`);
    const illustration = await generateIllustration(llm, { brief: firstBrief, accentColor: "#f97316" });
    console.log(`✓ illustration "${illustration.name}": ${illustration.paths.length} paths, viewBox ${JSON.stringify(illustration.viewBox)}`);
  }

  console.log("\nSmoke test passed.");
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
