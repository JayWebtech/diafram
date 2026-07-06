import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { SynthesizedAudio, TtsPort, TtsRequest } from "./port";

const run = promisify(execFile);

/**
 * macOS `say`-based TTS (dev/local: free, no API key, fully offline).
 *
 * `say` synthesizes to AIFF; ffmpeg transcodes to MP3 and ffprobe reads the
 * duration. Robotic but real — good enough to build and verify the whole audio
 * path end-to-end. Requires an EXPLICIT voice (the unset system default emits
 * silence), defaulting to "Samantha".
 */
export class SayTtsProvider implements TtsPort {
  constructor(private readonly voice = "Samantha") {}

  async synthesize({ text, voice }: TtsRequest): Promise<SynthesizedAudio> {
    const dir = await mkdtemp(join(tmpdir(), "diafram-tts-"));
    const aiff = join(dir, "n.aiff");
    const mp3 = join(dir, "n.mp3");
    try {
      await run("say", ["-v", voice ?? this.voice, "-o", aiff, text]);
      await run("ffmpeg", ["-y", "-i", aiff, "-codec:a", "libmp3lame", "-b:a", "96k", mp3]);
      const [buffer, durationSeconds] = await Promise.all([readFile(mp3), probeDuration(mp3)]);
      return {
        dataUri: `data:audio/mpeg;base64,${buffer.toString("base64")}`,
        durationSeconds,
      };
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}

async function probeDuration(file: string): Promise<number> {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  const seconds = Number.parseFloat(stdout.trim());
  return Number.isFinite(seconds) ? seconds : 0;
}
