import { z } from "zod";
import {
  AUDIO_ANALYSIS_VERSION,
  IELTS_SPEAKING_RUBRIC_VERSION,
  SCORING_SCHEMA_VERSION
} from "@/lib/scoring/rubric";

const skillFeedbackSchema = z.object({
  band: z.number().min(0).max(9),
  feedback: z.string(),
  evidence: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([])
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

const partDiagnosticSchema = z.object({
  part: z.enum(["PART1", "PART2", "PART3"]),
  estimated_band: z.number().min(0).max(9),
  summary: z.string(),
  strengths: z.array(z.string()).default([]),
  priorities: z.array(z.string()).default([])
});

export const feedbackSchema = z.object({
  estimated_band: z.number().min(0).max(9).default(0),
  fluency_coherence: skillFeedbackSchema,
  lexical_resource: skillFeedbackSchema,
  grammar_range_accuracy: skillFeedbackSchema,
  pronunciation: skillFeedbackSchema.extend({ note: z.string() }),
  strengths: z.array(z.string()),
  mistakes: z.array(
    z.object({
      original: z.string(),
      correction: z.string(),
      reason: z.string()
    })
  ),
  better_answer: z.string(),
  next_step: z.string(),
  target_band_advice: z.string(),
  concise_feedback: z.string().default(""),
  detailed_coaching: z.object({
    fluency_drills: z.array(z.string()).default([]),
    pronunciation_tips: z.array(z.string()).default([]),
    grammar_focus: z.array(z.string()).default([]),
    vocabulary_upgrades: z.array(z.string()).default([]),
    better_response_strategy: z.string().default("")
  }).default({
    fluency_drills: [],
    pronunciation_tips: [],
    grammar_focus: [],
    vocabulary_upgrades: [],
    better_response_strategy: ""
  }),
  part_diagnostics: z.array(partDiagnosticSchema).default([]),
  audio_analysis: z.object({
    status: z.enum(["completed", "partial", "timeout", "unavailable"]).default("unavailable"),
    summary: z.string().default("Audio analysis was not available for this report."),
    observations: z.array(z.string()).default([]),
    metrics: audioMetricsSchema.optional()
  }).default({
    status: "unavailable",
    summary: "Audio analysis was not available for this report.",
    observations: []
  }),
  metadata: z.object({
    rubricVersion: z.string().default(IELTS_SPEAKING_RUBRIC_VERSION),
    audioAnalysisVersion: z.string().default(AUDIO_ANALYSIS_VERSION),
    scoringSchemaVersion: z.string().default(SCORING_SCHEMA_VERSION),
    scoringMode: z.enum(["hybrid", "transcript_only"]).default("transcript_only"),
    model: z.string().default("unknown"),
    limitations: z.array(z.string()).default([])
  }).default({
    rubricVersion: IELTS_SPEAKING_RUBRIC_VERSION,
    audioAnalysisVersion: AUDIO_ANALYSIS_VERSION,
    scoringSchemaVersion: SCORING_SCHEMA_VERSION,
    scoringMode: "transcript_only",
    model: "unknown",
    limitations: []
  })
});

export type SpeakingFeedback = z.infer<typeof feedbackSchema>;
export type SpeakingAudioMetrics = z.infer<typeof audioMetricsSchema>;
