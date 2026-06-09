export const allowedRealtimeVoices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"] as const;

export type RealtimeVoice = (typeof allowedRealtimeVoices)[number];

export const defaultRealtimeVoice: RealtimeVoice = "Puck";

export function isRealtimeVoice(value: unknown): value is RealtimeVoice {
  return typeof value === "string" && allowedRealtimeVoices.includes(value as RealtimeVoice);
}
