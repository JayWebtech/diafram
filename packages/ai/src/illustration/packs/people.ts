import { createAvatar } from "@dicebear/core";
import * as openPeeps from "@dicebear/open-peeps";
import { newIllustrationId, zIllustration, type Illustration } from "@diafram/schema";
import { sanitizeMarkup } from "../../svg/markup";
import type { IllustrationRequest, IllustrationSource } from "../source";

/**
 * People source: hand-drawn Open Peeps characters (via DiceBear, generated
 * locally — deterministic per brief, no network). These are filled, colored
 * illustrations, so they're `wipe`-revealed rather than stroke-drawn.
 *
 * Only responds to person/people briefs; returns `null` otherwise so the chain
 * falls through to the line-art library.
 */
const PERSON_TOKENS = new Set([
  "person", "people", "human", "user", "users", "man", "woman", "someone", "somebody",
  "individual", "customer", "team", "group", "everyone", "worker", "colleague",
  "friend", "member", "persons", "guy", "girl", "boy", "developer", "student", "you",
]);

function isPersonBrief(brief: string): boolean {
  const tokens = brief
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return tokens.some((t) => PERSON_TOKENS.has(t));
}

export class PeopleIllustrationSource implements IllustrationSource {
  async resolve(request: IllustrationRequest): Promise<Illustration | null> {
    if (!isPersonBrief(request.brief)) return null;

    const id = newIllustrationId();
    // Seed by brief → deterministic, and distinct briefs get distinct characters.
    const svg = createAvatar(openPeeps, { seed: request.brief, size: 200 }).toString();
    const { viewBox, markup } = await sanitizeMarkup(svg, `${id}-`);

    return zIllustration.parse({
      id,
      name: request.brief,
      viewBox,
      paths: [],
      markup,
      reveal: "wipe",
      accentColor: null,
      promptHash: null,
      styleVersion: 1,
    });
  }
}
