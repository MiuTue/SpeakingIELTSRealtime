import { describe, expect, it } from "vitest";
import {
  buildGeminiLiveSetup,
  GEMINI_LIVE_MODEL,
  USER_SILENCE_DURATION_MS,
  type RealtimeSessionInput
} from "@/lib/realtime/sessionConfig";

describe("Gemini Live session config", () => {
  it("builds the current Live API setup message", () => {
    const input: RealtimeSessionInput = {
      mode: "PART1",
      part: "PART1",
      topic: "Work or study",
      targetBand: 7,
      voice: "Puck"
    };

    const setupMessage = buildGeminiLiveSetup(input);

    expect(GEMINI_LIVE_MODEL).toBe("models/gemini-3.1-flash-live-preview");
    expect(setupMessage.setup.model).toBe(GEMINI_LIVE_MODEL);
    expect(setupMessage.setup.generationConfig.responseModalities).toEqual(["AUDIO"]);
    expect(setupMessage.setup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe("Puck");
    expect(setupMessage.setup.realtimeInputConfig).toEqual({
      activityHandling: "NO_INTERRUPTION",
      automaticActivityDetection: {
        disabled: false,
        silenceDurationMs: USER_SILENCE_DURATION_MS
      }
    });
    expect(setupMessage.setup.inputAudioTranscription).toEqual({});
    expect(setupMessage.setup.outputAudioTranscription).toEqual({});
    expect("inputTranscription" in setupMessage.setup).toBe(false);
  });
});
