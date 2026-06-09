import { describe, expect, it } from "vitest";
import { allowedRealtimeVoices, defaultRealtimeVoice, isRealtimeVoice } from "@/lib/realtime/voices";

describe("realtime voice whitelist", () => {
  it("allows production preset voices", () => {
    expect(isRealtimeVoice(defaultRealtimeVoice)).toBe(true);
    expect(allowedRealtimeVoices.every(isRealtimeVoice)).toBe(true);
  });

  it("rejects unsupported custom voice identifiers", () => {
    expect(isRealtimeVoice("custom-cloned-voice")).toBe(false);
    expect(isRealtimeVoice("winna-uploaded-sample")).toBe(false);
    expect(isRealtimeVoice(null)).toBe(false);
  });
});
