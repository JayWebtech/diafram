import { describe, expect, it } from "vitest";
import { createLlmPort, resolvePlatform } from "./factory";

describe("llm factory", () => {
  it("resolves platform names and defaults to deepseek", () => {
    expect(resolvePlatform({ PLATFORM: "claude" })).toBe("claude");
    expect(resolvePlatform({ PLATFORM: "anthropic" })).toBe("claude");
    expect(resolvePlatform({ PLATFORM: "DeepSeek" })).toBe("deepseek");
    expect(resolvePlatform({})).toBe("deepseek");
  });

  it("rejects unknown platforms", () => {
    expect(() => resolvePlatform({ PLATFORM: "gpt" })).toThrow(/Unknown PLATFORM/);
  });

  it("builds a port for each provider (no network)", () => {
    const deepseek = createLlmPort({ PLATFORM: "deepseek", DEEPSEEK_API_KEY: "sk-test" });
    expect(typeof deepseek.generateObject).toBe("function");
    const claude = createLlmPort({ PLATFORM: "claude", ANTHROPIC_API_KEY: "sk-ant-test" });
    expect(typeof claude.generateText).toBe("function");
  });

  it("throws when the selected provider's key is missing", () => {
    expect(() => createLlmPort({ PLATFORM: "claude" })).toThrow(/ANTHROPIC_API_KEY/);
    expect(() => createLlmPort({ PLATFORM: "deepseek" })).toThrow(/DEEPSEEK_API_KEY/);
  });
});
