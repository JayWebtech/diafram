import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { LibraryEntry } from "../starter-pack";

/**
 * Import icons from the `lucide-static` package (ISC license, ~1,500 consistent
 * line icons) into `LibraryEntry` shape. Filenames double as keywords, so tags
 * come for free. Missing files (Lucide renames across versions) are skipped, so
 * the curated list is resilient.
 */
/**
 * Locate the lucide-static icons directory by walking `node_modules` up from the
 * running app's cwd (and this module's location).
 *
 * Deliberately NOT using `require.resolve`/`createRequire`: a bundler (Next)
 * rewrites and breaks those in the server bundle. A plain filesystem walk is
 * bundler-proof. `lucide-static` is a direct dependency of the apps that run the
 * pipeline, so `<app>/node_modules/lucide-static/icons` resolves.
 */
function lucideIconDir(): string {
  const candidates: string[] = [];
  const walkUp = (start: string) => {
    let dir = start;
    for (let i = 0; i < 8; i++) {
      candidates.push(join(dir, "node_modules", "lucide-static", "icons"));
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  };

  walkUp(process.cwd());
  try {
    walkUp(dirname(fileURLToPath(import.meta.url)));
  } catch {
    // import.meta.url unavailable in this context — cwd walk is enough.
  }

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }

  throw new Error(
    "Could not locate the lucide-static icons directory. Ensure `lucide-static` is a dependency of the running app.",
  );
}

export interface LucideSpec {
  /** Lucide icon filename (without .svg). */
  file: string;
  /** Extra search keywords beyond the filename tokens. */
  keywords?: string[];
}

/** Trim a Lucide file (which has a leading license comment) to its <svg> element. */
function extractSvg(raw: string): string {
  const start = raw.indexOf("<svg");
  const end = raw.lastIndexOf("</svg>");
  return start !== -1 && end !== -1 ? raw.slice(start, end + "</svg>".length) : raw;
}

export function loadLucidePack(specs: LucideSpec[]): LibraryEntry[] {
  const dir = lucideIconDir();
  const entries: LibraryEntry[] = [];

  for (const spec of specs) {
    let svg: string;
    try {
      svg = extractSvg(readFileSync(join(dir, `${spec.file}.svg`), "utf8"));
    } catch {
      continue; // icon not present in this Lucide version — skip
    }
    const fileTokens = spec.file.split("-");
    entries.push({
      name: spec.file.replace(/-/g, " "),
      keywords: Array.from(new Set([...fileTokens, ...(spec.keywords ?? [])])),
      svg,
    });
  }

  return entries;
}

/**
 * A curated concept set covering common explainer topics. Each entry augments
 * the filename tokens with domain synonyms so retrieval matches natural briefs.
 */
export const CURATED_LUCIDE: LucideSpec[] = [
  { file: "user", keywords: ["person", "human", "individual", "someone"] },
  { file: "users", keywords: ["people", "group", "team", "everyone", "crowd"] },
  { file: "notebook", keywords: ["ledger", "journal", "records", "notes"] },
  { file: "book-open", keywords: ["book", "reading", "open", "story"] },
  { file: "file-text", keywords: ["document", "file", "page", "paper", "form"] },
  { file: "lock", keywords: ["padlock", "secure", "security", "locked", "encryption", "closed"] },
  { file: "lock-open", keywords: ["unlock", "unlocked", "access", "decrypt", "open"] },
  { file: "key", keywords: ["password", "secret", "credential", "access", "private"] },
  { file: "shield", keywords: ["protection", "safe", "defense", "security"] },
  { file: "shield-check", keywords: ["verified", "protected", "trusted", "secure"] },
  { file: "check", keywords: ["correct", "done", "valid", "yes", "approved"] },
  { file: "circle-check", keywords: ["verified", "success", "confirmed", "complete"] },
  { file: "circle-x", keywords: ["wrong", "error", "rejected", "invalid", "no"] },
  { file: "arrow-right", keywords: ["arrow", "next", "flow", "forward", "send", "transfer"] },
  { file: "arrow-left-right", keywords: ["exchange", "swap", "transfer", "between", "trade"] },
  { file: "link", keywords: ["connection", "chain", "url", "linked"] },
  { file: "network", keywords: ["nodes", "distributed", "peers", "mesh", "topology", "decentralized"] },
  { file: "share-2", keywords: ["share", "distribute", "broadcast", "connections", "spread"] },
  { file: "box", keywords: ["block", "package", "container", "cube", "parcel"] },
  { file: "boxes", keywords: ["blocks", "stack", "chain", "packages", "storage"] },
  { file: "database", keywords: ["data", "storage", "records", "db", "store"] },
  { file: "server", keywords: ["backend", "host", "machine", "compute", "rack"] },
  { file: "cloud", keywords: ["cloud", "internet", "remote", "hosting", "saas"] },
  { file: "globe", keywords: ["world", "internet", "web", "global", "earth", "online"] },
  { file: "wifi", keywords: ["wireless", "signal", "connection", "internet"] },
  { file: "monitor", keywords: ["computer", "screen", "display", "desktop", "website"] },
  { file: "laptop", keywords: ["computer", "notebook", "device", "portable"] },
  { file: "smartphone", keywords: ["phone", "mobile", "device", "cell"] },
  { file: "mail", keywords: ["email", "message", "envelope", "letter", "inbox"] },
  { file: "send", keywords: ["send", "submit", "deliver", "transmit"] },
  { file: "search", keywords: ["find", "magnify", "look", "explore", "discover"] },
  { file: "eye", keywords: ["view", "see", "watch", "visible", "observe"] },
  { file: "lightbulb", keywords: ["idea", "insight", "innovation", "think", "solution"] },
  { file: "brain", keywords: ["think", "mind", "intelligence", "learn", "smart"] },
  { file: "cpu", keywords: ["processor", "chip", "compute", "hardware"] },
  { file: "code", keywords: ["programming", "developer", "software", "syntax"] },
  { file: "git-branch", keywords: ["branch", "version", "fork", "split"] },
  { file: "coins", keywords: ["money", "currency", "cash", "payment", "token", "crypto"] },
  { file: "banknote", keywords: ["money", "cash", "bill", "payment", "currency"] },
  { file: "credit-card", keywords: ["payment", "card", "pay", "purchase", "bank"] },
  { file: "landmark", keywords: ["bank", "institution", "government", "building", "authority"] },
  { file: "handshake", keywords: ["agreement", "deal", "trust", "partnership", "consensus"] },
  { file: "clock", keywords: ["time", "timer", "schedule", "wait", "duration"] },
  { file: "calendar", keywords: ["date", "schedule", "event", "day", "plan"] },
  { file: "trending-up", keywords: ["growth", "increase", "rise", "progress", "chart"] },
  { file: "chart-column", keywords: ["chart", "graph", "bars", "statistics", "data", "analytics"] },
  { file: "triangle-alert", keywords: ["warning", "caution", "alert", "danger", "risk"] },
  { file: "fingerprint", keywords: ["identity", "biometric", "unique", "authentication", "signature"] },
  { file: "scan", keywords: ["scan", "verify", "read", "detect"] },
  { file: "settings", keywords: ["configuration", "options", "gear", "preferences", "setup"] },
];

/**
 * Load the ENTIRE Lucide set (filenames become search keywords), merging the
 * curated domain synonyms above. ~2,000 professional icons gives broad coverage
 * so retrieval almost always finds a clean icon and the weak LLM artist is
 * rarely used. Icons that fail ingestion are skipped downstream.
 */
export function loadAllLucide(): LibraryEntry[] {
  const dir = lucideIconDir();
  const synonyms = new Map(CURATED_LUCIDE.map((s) => [s.file, s.keywords ?? []]));
  const entries: LibraryEntry[] = [];

  for (const filename of readdirSync(dir)) {
    if (!filename.endsWith(".svg")) continue;
    const file = filename.slice(0, -4);
    let svg: string;
    try {
      svg = extractSvg(readFileSync(join(dir, filename), "utf8"));
    } catch {
      continue;
    }
    entries.push({
      name: file.replace(/-/g, " "),
      keywords: Array.from(new Set([...file.split("-"), ...(synonyms.get(file) ?? [])])),
      svg,
    });
  }

  return entries;
}
