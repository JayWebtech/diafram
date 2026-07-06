import type { Prisma } from "@prisma/client";
import { zIllustration, type Illustration } from "@diafram/schema";
import { prisma } from "./client";

/**
 * Content-addressed illustration store (the durable backing for the reuse
 * library). An adapter satisfying `@diafram/ai`'s `IllustrationLibrary` port
 * can be composed from these in the worker/web without coupling db → ai.
 */
export async function getIllustration(hash: string): Promise<Illustration | null> {
  const row = await prisma.illustration.findUnique({ where: { hash } });
  return row ? zIllustration.parse(row.data) : null;
}

export async function putIllustration(hash: string, illustration: Illustration): Promise<void> {
  const data = illustration as unknown as Prisma.InputJsonValue;
  await prisma.illustration.upsert({
    where: { hash },
    create: { hash, name: illustration.name, data },
    update: { data },
  });
}

/** A `{ get, put }` object that satisfies the ai package's IllustrationLibrary. */
export const illustrationLibrary = {
  get: getIllustration,
  put: (hash: string, illustration: Illustration) => putIllustration(hash, illustration),
};
