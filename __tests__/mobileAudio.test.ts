import { describe, expect, it } from "vitest";
import {
  buildCandidateAudio,
  resamplePCM16
} from "../mobile/src/lib/audio";

describe("mobile realtime audio", () => {
  it("resamples Gemini 24 kHz PCM for the 16 kHz native player", () => {
    const source = new Int16Array(24_000);
    source.fill(1000);
    const result = resamplePCM16(
      new Uint8Array(source.buffer),
      24_000,
      16_000
    );

    expect(result.byteLength).toBe(16_000 * 2);
  });

  it("builds a WAV payload and delivery metrics for candidate speech", () => {
    const samples = new Int16Array(16_000);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = index % 100 < 50 ? 4000 : -4000;
    }
    const audio = buildCandidateAudio(
      [new Uint8Array(samples.buffer)],
      "I am currently studying software engineering."
    );

    expect(audio?.mimeType).toBe("audio/wav");
    expect(audio?.durationMs).toBe(1000);
    expect(audio?.metrics.wordCount).toBe(6);
    expect(audio?.data.length).toBeGreaterThan(samples.byteLength);
  });
});
