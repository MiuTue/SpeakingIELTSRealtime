import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import type { CandidateTurnAudio } from "@/lib/scoring/audioMetrics";

const RETENTION_MS = 24 * 60 * 60 * 1000;
const AUDIO_TEMP_DIR = join(tmpdir(), "speakingai-audio");

export async function retainTemporaryAudio(
  turns: Array<{ part: string; audio?: CandidateTurnAudio }> | undefined,
  sessionLabel: string
) {
  if (!turns?.some((turn) => turn.audio?.data)) return;

  await mkdir(AUDIO_TEMP_DIR, { recursive: true });
  await cleanupExpiredAudio();

  await Promise.all(
    turns.map(async (turn, index) => {
      if (!turn.audio?.data) return;
      const safeLabel = sessionLabel.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
      const filename = `${Date.now()}-${safeLabel}-${index + 1}-${turn.part}.wav`;
      await writeFile(join(AUDIO_TEMP_DIR, filename), Buffer.from(turn.audio.data, "base64"));
    })
  );
}

async function cleanupExpiredAudio() {
  const now = Date.now();
  const files = await readdir(AUDIO_TEMP_DIR).catch(() => []);

  await Promise.all(
    files.map(async (file) => {
      const filepath = join(AUDIO_TEMP_DIR, file);
      const info = await stat(filepath).catch(() => null);
      if (!info) return;
      if (now - info.mtimeMs > RETENTION_MS) {
        await unlink(filepath).catch(() => undefined);
      }
    })
  );
}
