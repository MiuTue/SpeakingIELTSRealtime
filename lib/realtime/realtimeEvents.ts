import type { CandidateTurnAudio } from "@/lib/scoring/audioMetrics";

export const realtimeEventNames = {
  connected: "connected",
  disconnected: "disconnected",
  listening: "listening",
  userSpeechStarted: "user_speech_started",
  userSpeechStopped: "user_speech_stopped",
  examinerSpeaking: "examiner_speaking",
  examinerTurnDone: "examiner_turn_done",
  audioChunk: "audio_chunk",
  transcriptDelta: "transcript_delta",
  transcriptDone: "transcript_done",
  responseDone: "response_done",
  interrupted: "interrupted",
  error: "error",
  log: "log"
} as const;

export type RealtimeStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "listening"
  | "examiner_speaking"
  | "user_speaking"
  | "evaluating"
  | "feedback_ready"
  | "interrupted"
  | "ended"
  | "error";

export type RealtimeEventName =
  (typeof realtimeEventNames)[keyof typeof realtimeEventNames];

export type RealtimeLog = {
  id: string;
  type: string;
  direction: "client" | "server" | "system";
  payload?: unknown;
  createdAt: string;
};

export type RealtimeEventPayloads = {
  connected: undefined;
  disconnected: undefined;
  listening: undefined;
  user_speech_started: undefined;
  user_speech_stopped: undefined;
  examiner_speaking: undefined;
  examiner_turn_done: { transcript: string };
  audio_chunk: ArrayBuffer;
  transcript_delta: { itemId?: string; delta: string };
  transcript_done: { itemId?: string; transcript: string; audio?: CandidateTurnAudio };
  response_done: unknown;
  interrupted: undefined;
  error: Error;
  log: RealtimeLog;
};

export type RealtimeHandler<T extends RealtimeEventName> = (
  payload: RealtimeEventPayloads[T]
) => void;

export function createRealtimeLog(
  type: string,
  direction: RealtimeLog["direction"],
  payload?: unknown
): RealtimeLog {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    direction,
    payload,
    createdAt: new Date().toISOString()
  };
}
