import { PrismaClient } from "@prisma/client";

/**
 * A single PrismaClient per process. Reused across hot-reloads in dev so we
 * don't exhaust connections.
 */
const globalForPrisma = globalThis as unknown as { __diaframPrisma?: PrismaClient };

export const prisma = globalForPrisma.__diaframPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__diaframPrisma = prisma;
}
