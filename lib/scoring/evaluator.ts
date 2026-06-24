import { buildEvaluatorPrompt } from "@/lib/ielts/prompts";
import {
  feedbackSchema,
  type SpeakingAudioMetrics,
  type SpeakingFeedback
} from "@/lib/scoring/feedbackSchema";
import type { CandidateTurnAudio } from "@/lib/scoring/audioMetrics";
import { retainTemporaryAudio } from "@/lib/scoring/audioRetention";
import {
  AUDIO_ANALYSIS_VERSION,
  IELTS_SPEAKING_RUBRIC_VERSION,
  SCORING_SCHEMA_VERSION
} from "@/lib/scoring/rubric";

export type EvaluateAnswerInput = {
  question: string;
  transcript: string;
  turns?: Array<{
    part: "PART1" | "PART2" | "PART3";
    question: string;
    transcript: string;
    audio?: CandidateTurnAudio;
  }>;
  mode: string;
  part: string;
  topic: string;
  targetBand: number;
};

const DEFAULT_EVALUATOR_MODEL = "gemini-2.5-flash-lite";
const SCORING_TIMEOUT_MS = 45_000;

export async function evaluateAnswer(
  input: EvaluateAnswerInput
): Promise<SpeakingFeedback> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please set it in your environment variables.");
  }

  const hasAudio = input.turns?.some((turn) => turn.audio?.data) ?? false;
  const model = normalizeGeminiModel(process.env.GEMINI_EVALUATOR_MODEL ?? DEFAULT_EVALUATOR_MODEL);

  if (hasAudio) {
    await retainTemporaryAudio(input.turns, `${input.mode}-${input.topic}`).catch((error) => {
      console.error("Failed to retain temporary scoring audio:", error);
    });
  }

  try {
    return await requestFeedback(input, { apiKey, model, includeAudio: hasAudio });
  } catch (error) {
    if (!hasAudio) throw error;

    console.error("Hybrid audio scoring failed; retrying transcript-only fallback:", error);
    const fallback = await requestFeedback(input, { apiKey, model, includeAudio: false });
    return {
      ...fallback,
      pronunciation: {
        ...fallback.pronunciation,
        note: "Audio analysis was unavailable or timed out; pronunciation is estimated from transcript and speaking metrics only.",
        limitations: [
          ...fallback.pronunciation.limitations,
          "Audio analysis failed; pronunciation estimate is limited."
        ]
      },
      audio_analysis: {
        status: "timeout",
        summary: "Audio analysis did not complete within the scoring window. This report uses transcript-first scoring.",
        observations: [],
        metrics: summarizeAudioMetrics(input.turns)
      },
      metadata: {
        ...fallback.metadata,
        scoringMode: "transcript_only",
        model,
        limitations: [
          ...fallback.metadata.limitations,
          "Hybrid audio scoring failed and the report fell back to transcript-only scoring."
        ]
      }
    };
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit & { maxRetries?: number; baseDelayMs?: number },
  signal?: AbortSignal
): Promise<Response> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (signal?.aborted) {
        throw new Error("Aborted");
      }

      const response = await fetch(url, { ...options, signal });

      if (response.ok) {
        return response;
      }

      const isTransientStatus =
        response.status === 429 || (response.status >= 500 && response.status <= 599);

      if (isTransientStatus && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(
          `Gemini API returned status ${response.status}. Retrying in ${Math.round(
            delay
          )}ms... (Attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(resolve, delay);
          if (signal) {
            signal.addEventListener("abort", () => {
              clearTimeout(timeout);
              reject(new Error("Aborted"));
            });
          }
        });
        continue;
      }

      return response;
    } catch (error) {
      const isAbortError =
        error instanceof Error &&
        (error.name === "AbortError" || error.message === "Aborted");
      if (isAbortError) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(
          `Gemini API connection error: ${
            error instanceof Error ? error.message : error
          }. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(resolve, delay);
          if (signal) {
            signal.addEventListener("abort", () => {
              clearTimeout(timeout);
              reject(new Error("Aborted"));
            });
          }
        });
        continue;
      }

      throw error;
    }
  }

  throw new Error("Reached maximum retries");
}

async function requestFeedback(
  input: EvaluateAnswerInput,
  options: { apiKey: string; model: string; includeAudio: boolean }
): Promise<SpeakingFeedback> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCORING_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${options.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: buildEvaluatorPrompt(input)
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: buildScoringParts(input, options.includeAudio)
            }
          ],
          generationConfig: {
            temperature: 0.1,
            candidateCount: 1,
            responseMimeType: "application/json",
            responseSchema: geminiSchema
          }
        })
      },
      controller.signal
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Gemini evaluator API failed permanently after retries:", response.status, errorBody);
    throw new Error(`Gemini evaluator failed: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini evaluator returned an empty response.");
  }

  const feedback = calibrateFeedback(parseFeedback(text), input, options.includeAudio);
  return {
    ...feedback,
    metadata: {
      ...feedback.metadata,
      rubricVersion: IELTS_SPEAKING_RUBRIC_VERSION,
      audioAnalysisVersion: AUDIO_ANALYSIS_VERSION,
      scoringSchemaVersion: SCORING_SCHEMA_VERSION,
      scoringMode: options.includeAudio ? "hybrid" : "transcript_only",
      model: options.model
    }
  };
}

export function parseFeedback(raw: string): SpeakingFeedback {
  const parseJson = (value: string) => feedbackSchema.parse(normalizeFeedbackPayload(JSON.parse(value)));

  try {
    return parseJson(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return parseJson(raw.slice(start, end + 1));
    }
    throw new Error("Evaluator returned invalid feedback JSON");
  }
}

function normalizeFeedbackPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;

  const feedback = payload as Record<string, unknown>;
  const audioAnalysis = feedback.audio_analysis;
  if (audioAnalysis && typeof audioAnalysis === "object") {
    const analysis = audioAnalysis as Record<string, unknown>;
    analysis.status = normalizeAudioStatus(analysis.status);
  }

  const metadata = feedback.metadata;
  if (metadata && typeof metadata === "object") {
    const normalizedMetadata = metadata as Record<string, unknown>;
    normalizedMetadata.scoringMode = normalizeScoringMode(normalizedMetadata.scoringMode);
  }

  const partDiagnostics = feedback.part_diagnostics;
  if (Array.isArray(partDiagnostics)) {
    for (const diagnostic of partDiagnostics) {
      if (!diagnostic || typeof diagnostic !== "object") continue;
      const partDiagnostic = diagnostic as Record<string, unknown>;
      partDiagnostic.part = normalizeSpeakingPart(partDiagnostic.part);
    }
  }

  return feedback;
}

function normalizeAudioStatus(status: unknown) {
  if (typeof status !== "string") return status;
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["completed", "complete", "success", "successful", "audio_processed", "processed", "analyzed"].includes(normalized)) {
    return "completed";
  }
  if (["partial", "partially_completed", "incomplete"].includes(normalized)) return "partial";
  if (["timeout", "timed_out"].includes(normalized)) return "timeout";
  if (["unavailable", "not_available", "audio_unavailable", "none", "missing"].includes(normalized)) return "unavailable";
  return status;
}

function normalizeScoringMode(mode: unknown) {
  if (typeof mode !== "string") return mode;
  const normalized = mode.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["hybrid", "hybrid_transcript_audio", "hybrid_transcript_+_audio", "hybrid_transcript_and_audio"].includes(normalized)) {
    return "hybrid";
  }
  if (normalized.includes("hybrid") && normalized.includes("audio")) return "hybrid";
  if (["transcript_only", "transcript", "text_only", "fallback"].includes(normalized)) return "transcript_only";
  if (normalized.includes("transcript") && !normalized.includes("audio")) return "transcript_only";
  return mode;
}

function normalizeSpeakingPart(part: unknown) {
  if (typeof part !== "string") return part;
  const normalized = part.trim().toUpperCase().replace(/[\s_-]+/g, "");
  if (normalized === "PART1" || normalized === "1") return "PART1";
  if (normalized === "PART2" || normalized === "2") return "PART2";
  if (normalized === "PART3" || normalized === "3") return "PART3";
  return part;
}

const skillSchema = {
  type: "OBJECT",
  properties: {
    band: {
      type: "INTEGER",
      minimum: 0,
      maximum: 9,
      description: "One whole-number IELTS descriptor band selected from observable evidence."
    },
    feedback: { type: "STRING" },
    evidence: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    limitations: {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  },
  required: ["band", "feedback", "evidence", "limitations"]
};

const geminiSchema = {
  type: "OBJECT",
  properties: {
    fluency_coherence: skillSchema,
    lexical_resource: skillSchema,
    grammar_range_accuracy: skillSchema,
    pronunciation: {
      type: "OBJECT",
      properties: {
        band: {
          type: "INTEGER",
          minimum: 0,
          maximum: 9,
          description: "One whole-number IELTS pronunciation descriptor band."
        },
        feedback: { type: "STRING" },
        note: { type: "STRING" },
        evidence: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        limitations: {
          type: "ARRAY",
          items: { type: "STRING" }
        }
      },
      required: ["band", "feedback", "note", "evidence", "limitations"]
    },
    strengths: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    mistakes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          original: { type: "STRING" },
          correction: { type: "STRING" },
          reason: { type: "STRING" }
        },
        required: ["original", "correction", "reason"]
      }
    },
    better_answer: { type: "STRING" },
    next_step: { type: "STRING" },
    target_band_advice: { type: "STRING" },
    concise_feedback: { type: "STRING" },
    detailed_coaching: {
      type: "OBJECT",
      properties: {
        fluency_drills: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        pronunciation_tips: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        grammar_focus: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        vocabulary_upgrades: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        better_response_strategy: { type: "STRING" }
      },
      required: ["fluency_drills", "pronunciation_tips", "grammar_focus", "vocabulary_upgrades", "better_response_strategy"]
    },
    part_diagnostics: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          part: { type: "STRING", enum: ["PART1", "PART2", "PART3"] },
          estimated_band: { type: "NUMBER", minimum: 0, maximum: 9 },
          summary: { type: "STRING" },
          strengths: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          priorities: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["part", "estimated_band", "summary", "strengths", "priorities"]
      }
    },
    audio_analysis: {
      type: "OBJECT",
      properties: {
        status: { type: "STRING", enum: ["completed", "partial", "timeout", "unavailable"] },
        summary: { type: "STRING" },
        observations: {
          type: "ARRAY",
          items: { type: "STRING" }
        }
      },
      required: ["status", "summary", "observations"]
    }
  },
  required: [
    "fluency_coherence",
    "lexical_resource",
    "grammar_range_accuracy",
    "pronunciation",
    "strengths",
    "mistakes",
    "better_answer",
    "next_step",
    "target_band_advice",
    "concise_feedback",
    "detailed_coaching",
    "part_diagnostics",
    "audio_analysis"
  ]
};

function buildScoringParts(input: EvaluateAnswerInput, includeAudio: boolean) {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    {
      text: buildScoringText(input, includeAudio)
    }
  ];

  if (includeAudio) {
    input.turns?.forEach((turn, index) => {
      if (!turn.audio?.data) return;
      parts.push({
        text: `Candidate audio for turn ${index + 1} (${turn.part}). Use this together with the transcript and local metrics.`
      });
      parts.push({
        inlineData: {
          mimeType: turn.audio.mimeType,
          data: turn.audio.data
        }
      });
    });
  }

  return parts;
}

function buildScoringText(input: EvaluateAnswerInput, includeAudio: boolean) {
  const turns = input.turns?.length
    ? input.turns.map((turn, index) => ({
        index: index + 1,
        part: turn.part,
        question: turn.question,
        transcript: turn.transcript,
        audioAvailable: includeAudio && Boolean(turn.audio),
        metrics: turn.audio?.metrics
      }))
    : [];

  return [
    `Scoring mode: ${includeAudio ? "hybrid transcript + audio" : "transcript-only fallback"}.`,
    `Rubric version: ${IELTS_SPEAKING_RUBRIC_VERSION}. Audio analysis version: ${AUDIO_ANALYSIS_VERSION}. Schema version: ${SCORING_SCHEMA_VERSION}.`,
    `Mode: ${input.mode}. Part: ${input.part}. Topic: ${input.topic}.`,
    "Evaluate the IELTS Speaking performance. Return only JSON matching the schema.",
    "Score independently from the learner's target. The target band is intentionally not provided.",
    "Set each criterion band to one whole number from 0 to 9. Do not use decimal criterion bands.",
    "The target_band_advice field should describe how to improve by the next 0.5 band from the observed performance.",
    "Use exact enum literals only: audio_analysis.status must be one of completed, partial, timeout, unavailable.",
    "Do not call part diagnostics official IELTS part band scores.",
    includeAudio
      ? "Audio is attached after this text. Use it for pronunciation, intonation, stress, rhythm, intelligibility, pauses, and delivery fluency."
      : "Audio is unavailable. Mark audio_analysis.status as unavailable and clearly limit pronunciation confidence.",
    `Transcript:\n${input.transcript}`,
    `Turns JSON:\n${JSON.stringify(turns, null, 2)}`
  ].join("\n\n");
}

export function calibrateFeedback(
  feedback: SpeakingFeedback,
  input: EvaluateAnswerInput,
  includeAudio: boolean
): SpeakingFeedback {
  const fluencyCoherence = {
    ...feedback.fluency_coherence,
    band: normalizeCriterionBand(feedback.fluency_coherence.band)
  };
  const lexicalResource = {
    ...feedback.lexical_resource,
    band: normalizeCriterionBand(feedback.lexical_resource.band)
  };
  const grammarRangeAccuracy = {
    ...feedback.grammar_range_accuracy,
    band: normalizeCriterionBand(feedback.grammar_range_accuracy.band)
  };
  const pronunciation = {
    ...feedback.pronunciation,
    band: normalizeCriterionBand(feedback.pronunciation.band)
  };
  const metrics = summarizeAudioMetrics(input.turns);
  const limitations = [...feedback.metadata.limitations];
  const totalWords = input.turns?.reduce((sum, turn) => sum + countWords(turn.transcript), 0) ?? countWords(input.transcript);

  if (totalWords < 40) {
    limitations.push("The speech sample is short, so the estimated band has lower confidence.");
  }

  let audioStatus = feedback.audio_analysis.status;
  if (!includeAudio) audioStatus = "unavailable";
  if (includeAudio && metrics && metrics.speechCoverage < 0.2) {
    audioStatus = "partial";
    limitations.push("The captured audio contains limited detected speech, reducing pronunciation confidence.");
  }

  const estimatedBand = calculateOverallBand([
    fluencyCoherence.band,
    lexicalResource.band,
    grammarRangeAccuracy.band,
    pronunciation.band
  ]);

  return {
    ...feedback,
    estimated_band: estimatedBand,
    fluency_coherence: fluencyCoherence,
    lexical_resource: lexicalResource,
    grammar_range_accuracy: grammarRangeAccuracy,
    pronunciation,
    part_diagnostics: feedback.part_diagnostics.map((diagnostic) => ({
      ...diagnostic,
      estimated_band: roundToHalf(clampBand(diagnostic.estimated_band))
    })),
    audio_analysis: {
      ...feedback.audio_analysis,
      status: audioStatus,
      metrics
    },
    metadata: {
      ...feedback.metadata,
      scoringMode: includeAudio ? "hybrid" : "transcript_only",
      limitations: uniqueStrings(limitations)
    }
  };
}

export function calculateOverallBand(criterionBands: number[]) {
  if (criterionBands.length !== 4) {
    throw new Error("IELTS Speaking overall requires exactly four criterion bands.");
  }
  return roundToHalf(criterionBands.reduce((sum, band) => sum + clampBand(band), 0) / 4);
}

function summarizeAudioMetrics(turns: EvaluateAnswerInput["turns"]): SpeakingAudioMetrics | undefined {
  const metrics = turns?.map((turn) => turn.audio?.metrics).filter((metric): metric is NonNullable<typeof metric> => Boolean(metric));
  if (!metrics?.length) return undefined;

  const durationMs = metrics.reduce((sum, metric) => sum + metric.durationMs, 0);
  const wordCount = metrics.reduce((sum, metric) => sum + metric.wordCount, 0);
  return {
    durationMs,
    wordCount,
    estimatedWpm: durationMs > 0 ? Math.round((wordCount / (durationMs / 60000)) * 10) / 10 : 0,
    pauseRatio: average(metrics.map((metric) => metric.pauseRatio)),
    longPauseCount: metrics.reduce((sum, metric) => sum + metric.longPauseCount, 0),
    longestPauseMs: Math.max(...metrics.map((metric) => metric.longestPauseMs)),
    speechCoverage: average(metrics.map((metric) => metric.speechCoverage))
  };
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function normalizeCriterionBand(band: number) {
  return Math.round(clampBand(band));
}

function clampBand(band: number) {
  return Math.min(9, Math.max(0, band));
}

function roundToHalf(band: number) {
  return Math.round(band * 2) / 2;
}

function countWords(transcript: string) {
  return transcript.trim().split(/\s+/).filter(Boolean).length;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function normalizeGeminiModel(model: string) {
  return model.replace(/^models\//, "");
}
