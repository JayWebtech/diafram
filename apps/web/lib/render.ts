import "server-only";

/**
 * Base URL of the standalone render worker (apps/render `pnpm worker`).
 * In production this points at the render service / queue front door.
 */
export const RENDER_WORKER_URL = process.env.RENDER_WORKER_URL ?? "http://localhost:3939";
