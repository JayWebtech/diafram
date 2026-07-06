/**
 * `@diafram/db` — Prisma/Postgres persistence.
 *
 * Projects and the compiled VideoProject/storyboard live as validated JSON;
 * illustrations are content-addressed; render jobs are durable. Repositories
 * validate documents through the schema on the way out.
 */
export { prisma } from "./client";
export * from "./projects";
export * from "./illustrations";
export * from "./jobs";
