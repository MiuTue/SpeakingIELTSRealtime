import { describe, expect, it } from "vitest";
import { computeAudioMetrics } from "@/lib/scoring/audioMetrics";

describe("audio metrics", () => {
  it("computes speech delivery metrics from PCM samples", () => {
    const sampleRate = 16000;
    const speech = new Int16Array(sampleRate).fill(4000);
    const silence = new Int16Array(sampleRate).fill(0);
    const samples = new Int16Array(speech.length + silence.length + speech.length);
    samples.set(speech, 0);
    samples.set(silence, speech.length);
    samples.set(speech, speech.length + silence.length);

    const metrics = computeAudioMetrics(samples, sampleRate, "I like studying English because it helps me communicate clearly");

    expect(metrics.durationMs).toBe(3000);
    expect(metrics.wordCount).toBe(10);
    expect(metrics.estimatedWpm).toBe(200);
    expect(metrics.longPauseCount).toBe(1);
    expect(metrics.pauseRatio).toBeGreaterThan(0.3);
    expect(metrics.speechCoverage).toBeGreaterThan(0.6);
  });

  it("returns safe fallback metrics for empty audio", () => {
    const metrics = computeAudioMetrics(new Int16Array(), 16000, "");
    expect(metrics.durationMs).toBe(0);
    expect(metrics.pauseRatio).toBe(1);
    expect(metrics.speechCoverage).toBe(0);
  });

  it("adapts to quiet microphones and trims outer silence", () => {
    const sampleRate = 16000;
    const outerSilence = new Int16Array(sampleRate).fill(0);
    const quietSpeech = new Int16Array(sampleRate * 2).fill(500);
    const samples = new Int16Array(outerSilence.length * 2 + quietSpeech.length);
    samples.set(outerSilence, 0);
    samples.set(quietSpeech, outerSilence.length);
    samples.set(outerSilence, outerSilence.length + quietSpeech.length);

    const metrics = computeAudioMetrics(samples, sampleRate, "This quiet answer still contains clearly detectable speech");

    expect(metrics.durationMs).toBe(2000);
    expect(metrics.speechCoverage).toBe(1);
    expect(metrics.pauseRatio).toBe(0);
  });
});
