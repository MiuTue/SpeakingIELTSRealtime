import { z } from "zod";

export const practiceModeSchema = z.enum([
  "PART1",
  "PART2",
  "PART3",
  "FULL_TEST",
  "CUSTOM"
]);

export const speakingPartSchema = z.enum(["PART1", "PART2", "PART3"]);
export const mobileSessionStatusSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "SCORING",
  "COMPLETED",
  "CANCELLED"
]);

export const realtimeVoiceSchema = z.enum([
  "Aoede",
  "Charon",
  "Fenrir",
  "Kore",
  "Leda",
  "Orus",
  "Puck",
  "Zephyr"
]);

export const createMobileSessionSchema = z.object({
  mode: practiceModeSchema,
  topic: z.string().trim().min(1).max(120),
  targetBand: z.coerce.number().min(4).max(9),
  voice: realtimeVoiceSchema.default("Aoede")
});

export const sessionCheckpointSchema = z.object({
  clientTurnId: z.string().min(1).max(100).optional(),
  sequence: z.number().int().min(0),
  part: speakingPartSchema,
  question: z.string().max(1000).default(""),
  examinerTurnComplete: z.boolean().default(false),
  elapsedSeconds: z.number().int().min(0).default(0),
  updatedAt: z.string().datetime()
});

export const updateMobileSessionSchema = z.object({
  status: mobileSessionStatusSchema.optional(),
  checkpoint: sessionCheckpointSchema.nullable().optional(),
  durationSeconds: z.coerce.number().int().min(0).optional(),
  finalBand: z.coerce.number().min(0).max(9).nullable().optional(),
  version: z.number().int().positive()
});

export const createMobileTurnSchema = z.object({
  clientTurnId: z.string().min(1).max(100),
  sequence: z.number().int().min(0),
  part: speakingPartSchema,
  question: z.string().trim().min(1).max(1000),
  transcript: z.string().trim().min(1).max(20_000),
  durationSeconds: z.coerce.number().int().min(0).default(0)
});

export const registerDeviceSchema = z.object({
  installationId: z.string().min(8).max(200),
  platform: z.enum(["IOS", "ANDROID"]),
  appVersion: z.string().min(1).max(40),
  deviceName: z.string().max(100).optional()
});

export const updateMobileSettingsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetBand: z.coerce.number().min(4).max(9)
});

export const audioUploadRequestSchema = z.object({
  clientTurnId: z.string().min(1).max(100).optional(),
  contentType: z.enum(["audio/wav", "audio/x-wav"]),
  byteCount: z.number().int().positive().max(25 * 1024 * 1024)
});

const audioMetricsSchema = z.object({
  durationMs: z.number().min(0),
  wordCount: z.number().min(0),
  estimatedWpm: z.number().min(0),
  pauseRatio: z.number().min(0).max(1),
  longPauseCount: z.number().min(0),
  longestPauseMs: z.number().min(0),
  speechCoverage: z.number().min(0).max(1)
});

const evaluationAudioSchema = z.object({
  mimeType: z.literal("audio/wav"),
  data: z.string().min(1),
  sampleRate: z.number().int().positive(),
  durationMs: z.number().min(0),
  metrics: audioMetricsSchema
});

export const createEvaluationSchema = z.object({
  idempotencyKey: z.string().min(8).max(200),
  turns: z.array(
    z.object({
      clientTurnId: z.string().min(1).max(100),
      part: speakingPartSchema,
      question: z.string().min(1),
      transcript: z.string().min(1),
      audio: evaluationAudioSchema.optional()
    })
  ).min(1)
});

export const historyQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export type PracticeMode = z.infer<typeof practiceModeSchema>;
export type SpeakingPart = z.infer<typeof speakingPartSchema>;
export type RealtimeVoice = z.infer<typeof realtimeVoiceSchema>;
export type SessionCheckpoint = z.infer<typeof sessionCheckpointSchema>;
export type CreateMobileSessionInput = z.infer<typeof createMobileSessionSchema>;
export type CreateMobileTurnInput = z.infer<typeof createMobileTurnSchema>;
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;

export type MobileSessionSummary = {
  id: string;
  mode: PracticeMode;
  topic: string;
  targetBand: number;
  status: z.infer<typeof mobileSessionStatusSchema>;
  finalBand: number | null;
  durationSeconds: number;
  startedAt: string;
  endedAt: string | null;
  version: number;
};

export type MobileBootstrap = {
  user: {
    id: string;
    name: string;
    email: string;
    targetBand: number;
  };
  metrics: {
    avgBand: number;
    totalSessions: number;
    totalSpeakingMinutes: number;
    subSkills?: {
      fluency: number;
      lexical: number;
      grammar: number;
      pronunciation: number;
    } | null;
  };
  resumableSession: MobileSessionSummary | null;
  scoringSession?: MobileSessionSummary | null;
  appConfig: {
    minimumVersion: string;
    latestVersion: string;
    forceUpdate: boolean;
    maintenance: boolean;
    audioRetentionHours: number;
  };
};
