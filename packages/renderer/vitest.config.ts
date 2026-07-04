import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only the pure (non-React) modules are unit-tested here; the React
    // components are exercised end-to-end via the Player/render integration.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
