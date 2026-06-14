import { describe, expect, it } from "vitest";
import {
  audioUploadRequestSchema,
  createMobileSessionSchema,
  createMobileTurnSchema,
  sessionCheckpointSchema
} from "@speakielts/contracts";

describe("mobile contracts", () => {
  it("parses a complete live session request", () => {
    expect(
      createMobileSessionSchema.parse({
        mode: "FULL_TEST",
        topic: "Random Topics",
        targetBand: 7.5,
        voice: "Aoede"
      })
    ).toMatchObject({
      mode: "FULL_TEST",
      targetBand: 7.5
    });
  });

  it("keeps turn synchronization idempotent with a required client id", () => {
    expect(() =>
      createMobileTurnSchema.parse({
        sequence: 0,
        part: "PART1",
        question: "Do you work or are you a student?",
        transcript: "I am a student."
      })
    ).toThrow();
  });

  it("accepts a resumable examiner checkpoint", () => {
    expect(
      sessionCheckpointSchema.parse({
        sequence: 2,
        part: "PART1",
        question: "What do you enjoy about your studies?",
        examinerTurnComplete: true,
        elapsedSeconds: 45,
        updatedAt: new Date().toISOString()
      })
    ).toMatchObject({
      examinerTurnComplete: true,
      sequence: 2
    });
  });

  it("rejects oversized audio before issuing an upload URL", () => {
    expect(() =>
      audioUploadRequestSchema.parse({
        contentType: "audio/wav",
        byteCount: 26 * 1024 * 1024
      })
    ).toThrow();
  });
});
