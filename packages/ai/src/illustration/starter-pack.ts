/**
 * A small, hand-authored starter icon pack — deliberately simple, geometrically
 * clean line icons on a shared 100×100 viewBox.
 *
 * This is a PLACEHOLDER asset set to prove the library pipeline end-to-end. In
 * production it is replaced by a large, professionally-drawn, permissively
 * licensed pack (e.g. Open Peeps / Iconoir / Streamline) imported through the
 * same `LibraryEntry` shape. `accentPathIndexes` marks the paths that take the
 * project accent color.
 */
export interface LibraryEntry {
  name: string;
  keywords: string[];
  svg: string;
  accentPathIndexes?: number[];
}

const svg = (...paths: string[]) =>
  `<svg viewBox="0 0 100 100">${paths.map((d) => `<path d="${d}"/>`).join("")}</svg>`;

export const STARTER_PACK: LibraryEntry[] = [
  {
    name: "person",
    keywords: ["person", "people", "human", "user", "individual", "someone", "man", "woman"],
    svg: svg(
      "M38 26 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0",
      "M50 38 V66",
      "M34 50 H66",
      "M50 66 L40 84",
      "M50 66 L60 84",
    ),
  },
  {
    name: "notebook",
    keywords: ["notebook", "book", "ledger", "journal", "notes", "document", "page", "records", "open"],
    svg: svg(
      "M28 20 H72 V80 H28 Z",
      "M50 20 V80",
      "M34 34 H46",
      "M34 44 H46",
      "M54 34 H66",
      "M54 44 H66",
      "M58 20 V30 L62 27 L66 30 V20",
    ),
    accentPathIndexes: [6],
  },
  {
    name: "closed padlock",
    keywords: ["lock", "padlock", "secure", "security", "locked", "encryption", "protected", "closed"],
    svg: svg("M30 50 H70 V82 H30 Z", "M38 50 V42 a12 12 0 0 1 24 0 V50", "M50 62 V72"),
    accentPathIndexes: [2],
  },
  {
    name: "open padlock",
    keywords: ["unlock", "unlocked", "open lock", "access", "granted", "decrypt"],
    svg: svg("M30 50 H70 V82 H30 Z", "M38 50 V42 a12 12 0 0 1 24 0", "M50 62 V72"),
    accentPathIndexes: [2],
  },
  {
    name: "key",
    keywords: ["key", "unlock", "access", "private key", "secret", "credentials", "password"],
    svg: svg(
      "M22 50 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0",
      "M46 50 H78",
      "M70 50 V60",
      "M78 50 V60",
    ),
  },
  {
    name: "arrow",
    keywords: ["arrow", "next", "direction", "flow", "forward", "send", "share", "transfer"],
    svg: svg("M22 50 H72", "M72 50 L60 40", "M72 50 L60 60"),
  },
  {
    name: "block",
    keywords: ["block", "box", "cube", "data", "container", "package", "unit"],
    svg: svg("M32 40 H62 V72 H32 Z", "M32 40 L44 28 H74 L62 40", "M62 40 L74 28 V60 L62 72"),
  },
  {
    name: "chain link",
    keywords: ["chain", "link", "blockchain", "connected", "linked", "chained"],
    svg: svg(
      "M30 46 h16 a8 8 0 0 1 0 16 h-16 a8 8 0 0 1 0 -16 z",
      "M54 38 h16 a8 8 0 0 1 0 16 h-16 a8 8 0 0 1 0 -16 z",
    ),
  },
  {
    name: "network",
    keywords: ["network", "nodes", "distributed", "peers", "connections", "mesh", "decentralized", "copies", "shared"],
    svg: svg(
      "M50 50 L30 30",
      "M50 50 L70 30",
      "M50 50 L30 70",
      "M50 50 L70 70",
      "M44 50 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0",
      "M25 30 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0",
      "M65 30 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0",
      "M25 70 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0",
      "M65 70 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0",
    ),
    accentPathIndexes: [4],
  },
  {
    name: "computer",
    keywords: ["computer", "screen", "monitor", "laptop", "device", "website", "browser", "display", "digital"],
    svg: svg("M26 28 H74 V64 H26 Z", "M50 64 V74", "M38 74 H62"),
  },
  {
    name: "checkmark",
    keywords: ["check", "verified", "correct", "valid", "done", "verification", "approved", "success", "trust"],
    svg: svg("M26 50 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0", "M40 51 L48 60 L62 42"),
    accentPathIndexes: [1],
  },
  {
    name: "envelope",
    keywords: ["envelope", "mail", "message", "letter", "email", "communication"],
    svg: svg("M26 34 H74 V66 H26 Z", "M26 34 L50 52 L74 34"),
  },
  {
    name: "magnifier",
    keywords: ["search", "magnify", "find", "inspect", "examine", "look", "discover"],
    svg: svg("M30 46 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0", "M58 58 L74 74"),
  },
];
