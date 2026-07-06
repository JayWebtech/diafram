import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared workspace packages ship TypeScript source (source-exports
  // pattern), so Next must transpile them. `@diafram/ai` is only imported from
  // server actions; its Node-only deps never reach the client bundle.
  transpilePackages: ["@diafram/schema", "@diafram/engine", "@diafram/renderer", "@diafram/ai"],
  // Keep these out of the server bundle: the embedding stack has native
  // binaries, and lucide-static's icons are read from node_modules via fs at
  // runtime (so it must stay unbundled and resolvable).
  serverExternalPackages: ["@xenova/transformers", "sharp", "onnxruntime-node", "lucide-static"],
};

export default nextConfig;
