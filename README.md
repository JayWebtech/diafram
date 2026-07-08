<div align="center">

# diafram

**Turn a sentence into a narrated, hand-drawn explainer video.**

Type a topic → review an AI-generated storyboard → get a render-ready 1080p video with self-drawing illustrations and voiceover.

Built with Next.js · React 19 · Remotion · Prisma · TypeScript

</div>

---

## What it does

diafram is an AI pipeline that produces short "whiteboard" style explainer videos. You give it a prompt like _"Explain how HTTPS works"_, and it:

1. **Writes a storyboard** — an LLM (DeepSeek or Claude) breaks the topic into scenes, each with narration and a set of illustration briefs.
2. **Pauses for your review** — you edit or approve the storyboard before any expensive art/render work happens.
3. **Resolves the artwork** — each brief is matched to an illustration from a curated library (the full ~2,000-icon Lucide set + hand-drawn people), falling back to the LLM only when nothing fits. Identical briefs are deduplicated through a content-addressed reuse cache.
4. **Adds narration** — scene text is synthesized to speech (macOS `say` out of the box; ElevenLabs / OpenAI slots are stubbed in).
5. **Compiles a `VideoProject`** — a validated, self-contained document describing the timeline, camera, strokes, and audio.
6. **Renders to MP4** — a standalone Remotion worker draws every stroke with an animated `stroke-dasharray` reveal and encodes 1080p @ 30fps.

You preview the result live in the browser (`@remotion/player`) and export the final file from a background render worker.

---

## Architecture

diafram is a **pnpm + Turborepo monorepo**. Two apps sit on top of six shared packages.

```
diafram/
├─ apps/
│  ├─ web      @diafram/web     Next.js 15 editor UI: prompt → storyboard → editor + live preview + export
│  └─ render   @diafram/render  Standalone Remotion render worker (HTTP service) + Remotion Studio
└─ packages/
   ├─ schema   @diafram/schema    Zod schemas + shared constants (source of truth for the data model)
   ├─ engine   @diafram/engine    Deterministic timeline/animation math (camera, easing, draw state)
   ├─ renderer @diafram/renderer  React/Remotion components that turn a VideoProject into frames
   ├─ ai       @diafram/ai        LLM ports, storyboard/artist agents, illustration library, TTS
   ├─ db       @diafram/db        Prisma client + PostgreSQL schema (projects, illustrations, jobs)
   └─ storage  @diafram/storage   Object storage port: local filesystem (dev) or Cloudflare R2 (prod)
```

**Request flow**

```
                 ┌────────────────────────── apps/web (Next.js) ──────────────────────────┐
   prompt  ─────▶│  PromptComposer → StoryboardReview → Editor (@remotion/player preview)  │
                 │        │ server actions (@diafram/ai)                    │ export        │
                 └────────┼─────────────────────────────────────────────────┼──────────────┘
                          ▼                                                  ▼
              storyboard + artwork + narration                    POST /render (project JSON)
                          │                                                  ▼
                          ▼                          ┌──────── apps/render (worker) ────────┐
                   VideoProject (JSON) ─────────────▶│  Remotion headless render → MP4      │
                                                     │  job state → Postgres, file → storage│
                                                     └──────────────────────────────────────┘
```

The web app and the render worker are **separate processes** that talk over HTTP, so long renders never block the UI and survive a restart (job state lives in Postgres).

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | ≥ 20 | |
| **pnpm** | 10.6.1 | `corepack enable && corepack prepare pnpm@10.6.1 --activate` |
| **PostgreSQL** | 14+ | Any local or hosted instance (Docker, Postgres.app, Neon, Supabase…) |
| **ffmpeg / ffprobe** | recent | Only needed for the default macOS `say` narration path |
| An LLM API key | — | **DeepSeek** or **Anthropic (Claude)** |

> **Narration note:** the default TTS provider uses the macOS `say` command, so out-of-the-box voice works on macOS only. On other platforms, set `TTS_PROVIDER=none` to render silent videos (everything else works identically).

---

## Quick start

### 1. Clone and install

```bash
git clone <your-repo-url> diafram
cd diafram
pnpm install
```

### 2. Create a PostgreSQL database

```bash
createdb diafram
# → connection string: postgresql://<user>:<pass>@localhost:5432/diafram
```

### 3. Configure environment variables

diafram reads env vars per-package. Create the following four files. **Never commit them** — they are git-ignored (`.env.example` files are allowed if you want to check in templates).

<details open>
<summary><code>apps/web/.env.local</code> — the editor UI</summary>

```dotenv
# LLM provider: "deepseek" or "claude"
PLATFORM=deepseek

# DeepSeek (used when PLATFORM=deepseek)
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-chat

# Anthropic / Claude (used when PLATFORM=claude)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-4-8   # or a cheaper tier, e.g. claude-haiku-4-5

# Narration (optional). Defaults to macOS `say`. Use "none" on non-macOS.
TTS_PROVIDER=say
TTS_VOICE=Samantha
# ELEVENLABS_API_KEY=...
# OPENAI_API_KEY=...

# Where the render worker lives (default shown)
RENDER_WORKER_URL=http://localhost:3939
```
</details>

<details open>
<summary><code>apps/render/.env</code> — the render worker</summary>

```dotenv
DATABASE_URL=postgresql://<user>:<pass>@localhost:5432/diafram

# "local" writes MP4s to disk; "r2" uses Cloudflare R2
STORAGE_BACKEND=local
STORAGE_DIR=.storage
RENDER_PORT=3939

# Only if STORAGE_BACKEND=r2:
# R2_ACCOUNT_ID=...
# R2_ACCESS_KEY_ID=...
# R2_SECRET_ACCESS_KEY=...
# R2_BUCKET=...
# R2_ENDPOINT=...            # optional custom endpoint
```
</details>

<details open>
<summary><code>packages/ai/.env</code> — used by AI scripts/tests run directly</summary>

```dotenv
PLATFORM=deepseek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-chat
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-4-8

# Opt-in semantic illustration retrieval (needs native deps: sharp/onnxruntime).
# Leave unset to use the robust lexical retriever.
# DIAFRAM_EMBEDDINGS=on
```
</details>

<details open>
<summary><code>packages/db/.env</code> — used by Prisma CLI</summary>

```dotenv
DATABASE_URL=postgresql://<user>:<pass>@localhost:5432/diafram
```
</details>

### 4. Set up the database

```bash
pnpm --filter @diafram/db generate    # generate the Prisma client
pnpm --filter @diafram/db migrate      # apply migrations to your database
```

### 5. Run it (two terminals)

**Terminal 1 — render worker** (must be running to export videos):

```bash
pnpm --filter @diafram/render worker
# → diafram render worker on http://localhost:3939 (storage: local)
```

**Terminal 2 — web editor:**

```bash
pnpm --filter @diafram/web dev
# → http://localhost:3000
```

Open **http://localhost:3000**, type a topic, review the storyboard, and hit generate. Preview plays in the browser; **Export** enqueues a job on the worker and downloads the finished MP4.

---

## Everyday commands

Run across the whole monorepo (via Turborepo):

```bash
pnpm build       # build every package/app
pnpm dev         # run all dev tasks
pnpm typecheck   # type-check everything
pnpm lint        # lint everything
pnpm test        # run all Vitest suites
```

Target a single workspace with `--filter`:

```bash
pnpm --filter @diafram/web dev            # just the web app
pnpm --filter @diafram/render worker      # just the render worker
pnpm --filter @diafram/ai test            # just the AI tests
```

**Remotion tooling** (in `apps/render`):

```bash
pnpm --filter @diafram/render studio      # open Remotion Studio to inspect compositions
pnpm --filter @diafram/render render      # render the sample "Explainer" composition to out/
pnpm --filter @diafram/render still       # export a single still frame
```

---

## Configuration reference

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `PLATFORM` | web, ai | `deepseek` | LLM provider: `deepseek` or `claude` |
| `DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL` | web, ai | — | DeepSeek credentials/model |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | web, ai | model `claude-opus-4-8` | Claude credentials/model |
| `TTS_PROVIDER` | web | `say` on macOS | `say` \| `none` (ElevenLabs/OpenAI stubbed) |
| `TTS_VOICE` | web | `Samantha` | Voice for the `say` provider |
| `DIAFRAM_EMBEDDINGS` | ai | off | `on` enables semantic icon retrieval (native deps) |
| `RENDER_WORKER_URL` | web | `http://localhost:3939` | Where the web app posts render jobs |
| `DATABASE_URL` | render, db | — | PostgreSQL connection string |
| `STORAGE_BACKEND` | render | `local` | `local` \| `r2` |
| `STORAGE_DIR` | render | `.storage` | Output directory for local storage |
| `RENDER_PORT` | render | `3939` | Render worker HTTP port |
| `R2_*` | render | — | Cloudflare R2 credentials (when `STORAGE_BACKEND=r2`) |

Render defaults (edit in `packages/schema/src/constants.ts`): **1920×1080**, **30 fps**.

---

## How generation works (under the hood)

- **`@diafram/schema`** is the single source of truth: every artifact (`Storyboard`, `VideoProject`, `Illustration`) is a Zod schema, validated at each trust boundary (server action input, render worker input).
- **Storyboard → Project is split** so the editor can insert a human checkpoint after the storyboard, before any art or narration cost is incurred (`generateStoryboard` then `generateProjectFromStoryboard`).
- **Illustrations are content-addressed** (`hash(brief + accent color)`) and cached in Postgres, so a brief that appears in many scenes is resolved once and reused.
- **The engine is deterministic** — the same project always yields the same frames, so the browser preview and the headless render agree exactly.
- **Rendering is decoupled** — the worker is a plain Node HTTP service that persists job state to Postgres and streams the finished MP4 from storage, independent of the Next.js process.

---

## Troubleshooting

- **`PLATFORM=claude requires ANTHROPIC_API_KEY`** — set the matching key for your chosen `PLATFORM`.
- **Export button does nothing / errors** — make sure the render worker (Terminal 1) is running and `RENDER_WORKER_URL` points to it.
- **No audio in the video** — narration uses macOS `say`; on Linux/Windows set `TTS_PROVIDER=none` (or wire up an ElevenLabs/OpenAI adapter).
- **`ffmpeg: command not found`** — install ffmpeg; it transcodes `say` output. Not needed when `TTS_PROVIDER=none`.
- **Prisma can't connect** — confirm `DATABASE_URL` in both `apps/render/.env` and `packages/db/.env`, and that Postgres is running.
- **Embedding/native-dep errors** — leave `DIAFRAM_EMBEDDINGS` unset; the default lexical retriever needs no native modules.

---

## Tech stack

**Frontend** Next.js 15, React 19, Tailwind CSS v4, Zustand, Framer Motion, `@remotion/player`
**Video** Remotion 4 (`@remotion/bundler`, `@remotion/renderer`, `@remotion/cli`)
**AI** Anthropic SDK, OpenAI/DeepSeek SDK, `@xenova/transformers` (local embeddings), Lucide + DiceBear icon packs
**Data** Prisma 6 + PostgreSQL, Cloudflare R2 / local filesystem storage
**Tooling** pnpm workspaces, Turborepo, TypeScript 5, Vitest

---

## License

_Add your license of choice here (e.g. MIT) before publishing._
