import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared workspace packages ship TypeScript source (source-exports
  // pattern), so Next must transpile them. `@diafram/ai` is only imported from
  // server actions; its Node-only deps never reach the client bundle.
  transpilePackages: ["@diafram/schema", "@diafram/engine", "@diafram/renderer", "@diafram/ai"],
};

export default nextConfig;
