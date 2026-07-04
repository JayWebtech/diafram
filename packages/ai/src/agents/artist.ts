import type { Illustration } from "@diafram/schema";
import type { LlmPort } from "../llm/port";
import { ingestIllustration } from "../svg/ingest";
import { SvgValidationError } from "../svg/sanitize";

/**
 * SVG artist agent — Step 3 of the pipeline.
 *
 * Generates a single minimalist, hand-drawn illustration as raw SVG, then runs
 * it through ingestion (sanitize → measure → validate). If ingestion rejects the
 * output, the specific reason is fed back to the model for a bounded number of
 * repair attempts — the model literally gets told what was wrong and tries again.
 */

const SYSTEM = `You draw single minimalist, hand-drawn whiteboard illustrations as SVG.
Strict rules:
- Output ONLY a single <svg> element with a viewBox. No prose, no markdown, no code fences.
- Use ONLY <path> elements inside the <svg>. No <rect>, <circle>, <line>, <text>, <image>,
  <use>, <script>, <style>, and no group/element transforms.
- Thick black outlines: stroke "#111111", stroke-width around 8, fill "none".
- Optionally use ONE accent color if provided, on at most one or two paths.
- Clean, simple, iconic shapes. Transparent background. Draw each meaningful stroke as its
  own <path> so it can be animated in order.`;

function extractSvg(raw: string): string {
  // Tolerate stray code fences or leading prose; keep from first <svg to last </svg>.
  const start = raw.indexOf("<svg");
  const end = raw.lastIndexOf("</svg>");
  if (start === -1 || end === -1) return raw.trim();
  return raw.slice(start, end + "</svg>".length);
}

export interface ArtistRequest {
  brief: string;
  accentColor?: string | null;
  promptHash?: string | null;
  maxAttempts?: number;
}

export async function generateIllustration(
  llm: LlmPort,
  request: ArtistRequest,
): Promise<Illustration> {
  const maxAttempts = request.maxAttempts ?? 3;
  const accent = request.accentColor ?? null;

  let feedback = "";
  let lastError = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const prompt = [
      `Draw: ${request.brief}.`,
      accent ? `Accent color available: ${accent}.` : "Black and white only.",
      feedback,
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await llm.generateText({ system: SYSTEM, prompt, temperature: 0.6 });
    try {
      return await ingestIllustration(extractSvg(raw), {
        name: request.brief,
        accentColor: accent,
        promptHash: request.promptHash ?? null,
      });
    } catch (err) {
      if (!(err instanceof SvgValidationError)) throw err;
      lastError = err.message;
      feedback = `Your previous SVG was rejected: ${err.message}. Fix it and return only the corrected <svg>.`;
    }
  }

  throw new SvgValidationError(
    `Artist failed to produce a valid illustration for "${request.brief}" after ${maxAttempts} attempts: ${lastError}`,
  );
}
