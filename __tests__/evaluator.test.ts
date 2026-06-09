import { describe, expect, it } from "vitest";
import { buildEvaluatorPrompt } from "@/lib/ielts/prompts";
import {
  calculateOverallBand,
  calibrateFeedback,
  parseFeedback
} from "@/lib/scoring/evaluator";

const feedback = {
  estimated_band: 6.5,
  fluency_coherence: { band: 6.5, feedback: "Clear." },
  lexical_resource: { band: 6, feedback: "Adequate." },
  grammar_range_accuracy: { band: 6, feedback: "Some errors." },
  pronunciation: { band: 6.5, feedback: "Estimated.", note: "Transcript only." },
  strengths: ["Direct answer"],
  mistakes: [{ original: "I very like", correction: "I really like", reason: "Natural phrase." }],
  better_answer: "I really like this topic because it is useful.",
  next_step: "Add a specific example.",
  target_band_advice: "Use wider vocabulary."
};

describe("feedback parsing", () => {
  it("parses strict JSON feedback", () => {
    const parsed = parseFeedback(JSON.stringify(feedback));
    expect(parsed.estimated_band).toBe(6.5);
    expect(parsed.metadata.rubricVersion).toBe("ielts-speaking-rubric-v2");
    expect(parsed.audio_analysis.status).toBe("unavailable");
  });

  it("repairs extra text around JSON", () => {
    const parsed = parseFeedback(`Here is feedback:\n${JSON.stringify(feedback)}\nDone`);
    expect(parsed.pronunciation.note).toContain("Transcript");
  });

  it("normalizes Gemini enum synonyms before validation", () => {
    const parsed = parseFeedback(JSON.stringify({
      ...feedback,
      audio_analysis: {
        status: "audio_processed",
        summary: "Audio processed successfully.",
        observations: ["Mostly clear delivery."]
      },
      metadata: {
        rubricVersion: "ielts-speaking-rubric-v1",
        audioAnalysisVersion: "audio-analysis-v1",
        scoringSchemaVersion: "speaking-feedback-v2",
        scoringMode: "hybrid transcript + audio",
        model: "gemini-test",
        limitations: []
      }
    }));

    expect(parsed.audio_analysis.status).toBe("completed");
    expect(parsed.metadata.scoringMode).toBe("hybrid");
  });

  it("calculates the equally weighted overall band to the nearest half", () => {
    expect(calculateOverallBand([7, 6, 6, 6])).toBe(6.5);
    expect(calculateOverallBand([7, 7, 6, 6])).toBe(6.5);
  });

  it("calibrates criterion bands and ignores the model overall", () => {
    const parsed = parseFeedback(JSON.stringify({
      ...feedback,
      estimated_band: 8.5,
      fluency_coherence: { band: 6.4, feedback: "Clear." },
      lexical_resource: { band: 6.6, feedback: "Flexible." },
      grammar_range_accuracy: { band: 5.6, feedback: "Some errors." },
      pronunciation: { band: 6.2, feedback: "Mostly clear.", note: "Audio reviewed." }
    }));

    const calibrated = calibrateFeedback(parsed, {
      question: "Practice speaking session",
      transcript: "This is a sufficiently long speaking sample used to verify that scoring is calculated from four criteria rather than accepting the model overall score without any deterministic validation.",
      mode: "PART1",
      part: "PART1",
      topic: "Work or study",
      targetBand: 8
    }, false);

    expect(calibrated.fluency_coherence.band).toBe(6);
    expect(calibrated.lexical_resource.band).toBe(7);
    expect(calibrated.grammar_range_accuracy.band).toBe(6);
    expect(calibrated.pronunciation.band).toBe(6);
    expect(calibrated.estimated_band).toBe(6.5);
  });

  it("does not expose the learner target band to the scoring prompt", () => {
    const prompt = buildEvaluatorPrompt({
      mode: "PART1",
      part: "PART1",
      topic: "Work or study",
      targetBand: 9,
      question: "Practice speaking session"
    });

    expect(prompt).not.toContain("Target band: 9");
    expect(prompt).toContain("whole-number descriptor band");
  });
});
