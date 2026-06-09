import { describe, expect, it } from "vitest";
import {
  buildPlannedQuestions,
  createInitialSessionState,
  isFinalPlannedQuestion,
  nextTurn,
  shouldShowFeedback
} from "@/lib/ielts/sessionMachine";

describe("IELTS session machine", () => {
  it("starts each practice mode on the correct part", () => {
    expect(createInitialSessionState("PART1").part).toBe("PART1");
    expect(createInitialSessionState("PART2").part).toBe("PART2");
    expect(createInitialSessionState("PART3").part).toBe("PART3");
  });

  it("moves full test through parts in order", () => {
    let state = createInitialSessionState("FULL_TEST");
    state = nextTurn(nextTurn(nextTurn(nextTurn(state))));
    expect(state.part).toBe("PART2");
    state = nextTurn(nextTurn(nextTurn(state)));
    expect(state.part).toBe("PART3");
  });

  it("hides full-test feedback until final report", () => {
    expect(shouldShowFeedback("PART1")).toBe(true);
    expect(shouldShowFeedback("FULL_TEST")).toBe(false);
    expect(shouldShowFeedback("FULL_TEST", true)).toBe(true);
  });

  it("builds the fixed full-test question plan", () => {
    const questions = buildPlannedQuestions("FULL_TEST", "Technology");
    expect(questions).toHaveLength(12);
    expect(questions[0].kind).toBe("identity");
    expect(questions.slice(1, 6).every((question) => question.part === "PART1")).toBe(true);
    expect(questions[6].part).toBe("PART2");
    expect(questions[6].kind).toBe("cue_card");
    expect(questions.slice(7).every((question) => question.part === "PART3")).toBe(true);
    expect(isFinalPlannedQuestion(11, questions)).toBe(true);
  });
});
