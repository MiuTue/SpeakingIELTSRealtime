import { beforeEach, describe, expect, it } from "vitest";
import { usePracticeStore } from "@/store/practiceStore";

describe("practice store", () => {
  beforeEach(() => {
    usePracticeStore.getState().reset();
  });

  it("tracks status and transcript deltas", () => {
    usePracticeStore.getState().setStatus("listening");
    usePracticeStore.getState().appendTranscript("Hello");
    usePracticeStore.getState().appendTranscript(" there");
    expect(usePracticeStore.getState().realtimeStatus).toBe("listening");
    expect(usePracticeStore.getState().transcript).toBe("Hello there");
  });

  it("maps part by selected mode", () => {
    usePracticeStore.getState().setSession("s1", "PART2", "Travel", 7);
    expect(usePracticeStore.getState().part).toBe("PART2");
  });

  it("tracks transcript timeline turns and clears live transcript", () => {
    usePracticeStore.getState().setSession("s1", "PART1", "Travel", 7);
    usePracticeStore.getState().appendTranscript("I enjoy travelling.");
    usePracticeStore.getState().addTurn({
      part: "PART1",
      question: usePracticeStore.getState().currentQuestion,
      transcript: usePracticeStore.getState().transcript
    });

    expect(usePracticeStore.getState().turns).toHaveLength(1);
    expect(usePracticeStore.getState().transcript).toBe("");
  });

  it("sets the live examiner question and optional part", () => {
    usePracticeStore.getState().setQuestion("Describe a memorable trip.", "PART2");
    expect(usePracticeStore.getState().currentQuestion).toBe("Describe a memorable trip.");
    expect(usePracticeStore.getState().part).toBe("PART2");
  });

  it("advances through full-test planned questions without ending practice modes", () => {
    usePracticeStore.getState().setSession("s2", "FULL_TEST", "Technology", 7);
    expect(usePracticeStore.getState().plannedQuestions).toHaveLength(12);
    const next = usePracticeStore.getState().advanceQuestion();
    expect(next?.part).toBe("PART1");
    expect(usePracticeStore.getState().activeQuestionIndex).toBe(1);
  });
});
