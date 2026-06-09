import { buildRealtimeInstructions } from "@/lib/ielts/prompts";
import type { realtimeSessionSchema } from "@/lib/api/schemas";
import type { z } from "zod";

export type RealtimeSessionInput = z.infer<typeof realtimeSessionSchema>;

export const GEMINI_LIVE_MODEL = "models/gemini-3.1-flash-live-preview";
export const USER_SILENCE_DURATION_MS = 1500;

export function buildGeminiLiveSetup(input: RealtimeSessionInput) {
  return {
    setup: {
      model: GEMINI_LIVE_MODEL,
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voice }
          }
        }
      },
      systemInstruction: {
        parts: [{ text: buildRealtimeInstructions(input) }]
      },
      realtimeInputConfig: {
        activityHandling: "NO_INTERRUPTION",
        automaticActivityDetection: {
          disabled: false,
          silenceDurationMs: USER_SILENCE_DURATION_MS
        }
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {}
    }
  };
}
