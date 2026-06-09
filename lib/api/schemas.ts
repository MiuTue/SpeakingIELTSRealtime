import { z } from "zod";
import { allowedRealtimeVoices, defaultRealtimeVoice } from "@/lib/realtime/voices";

export const practiceModeSchema = z.enum([
  "PART1",
  "PART2",
  "PART3",
  "FULL_TEST",
  "CUSTOM"
]);

export const speakingPartSchema = z.enum(["PART1", "PART2", "PART3"]);
export const realtimeVoiceSchema = z.enum(allowedRealtimeVoices).default(defaultRealtimeVoice);

export const createSessionSchema = z.object({
  mode: practiceModeSchema,
  topic: z.string().min(1).max(120),
  targetBand: z.coerce.number().min(4).max(9)
});

export const realtimeSessionSchema = createSessionSchema.extend({
  part: speakingPartSchema.optional(),
  voice: realtimeVoiceSchema
});

const audioMetricsInputSchema = z.object({
  durationMs: z.number().min(0),
  wordCount: z.number().min(0),
  estimatedWpm: z.number().min(0),
  pauseRatio: z.number().min(0).max(1),
  longPauseCount: z.number().min(0),
  longestPauseMs: z.number().min(0),
  speechCoverage: z.number().min(0).max(1)
});

const turnAudioInputSchema = z.object({
  mimeType: z.literal("audio/wav"),
  data: z.string().min(1),
  sampleRate: z.number().int().positive(),
  durationMs: z.number().min(0),
  metrics: audioMetricsInputSchema
});

const evaluateTurnSchema = z.object({
  part: speakingPartSchema,
  question: z.string().min(1),
  transcript: z.string().min(1),
  audio: turnAudioInputSchema.optional()
});

export const evaluateAnswerSchema = z.object({
  question: z.string().min(1),
  transcript: z.string().min(1),
  turns: z.array(evaluateTurnSchema).optional(),
  mode: practiceModeSchema,
  part: speakingPartSchema,
  topic: z.string().min(1),
  targetBand: z.coerce.number().min(4).max(9)
});

export const createTurnSchema = z.object({
  part: speakingPartSchema,
  question: z.string().min(1),
  transcript: z.string().min(1),
  durationSeconds: z.coerce.number().int().min(0).default(0),
  estimatedBand: z.coerce.number().min(0).max(9).optional(),
  feedbackJson: z.unknown().optional(),
  audioUrl: z.string().url().optional()
});

export const updateSessionSchema = z.object({
  finalBand: z.coerce.number().min(0).max(9).optional(),
  durationSeconds: z.coerce.number().int().min(0).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional()
});
