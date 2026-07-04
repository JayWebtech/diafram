import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every test here uses the fake LLM port or pure functions — no network,
    // no API key required.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
