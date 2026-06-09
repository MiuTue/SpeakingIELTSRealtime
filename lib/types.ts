import type { SpeakingFeedback } from "@/lib/scoring/feedbackSchema";
import type { PracticeMode, SpeakingPart } from "@/lib/ielts/sessionMachine";

export type SessionSummary = {
  id: string;
  mode: PracticeMode;
  topic: string;
  targetBand: number;
  startedAt: string | Date;
  finalBand: number | null;
  durationSeconds: number;
  status: string;
  turns?: SpeakingTurnSummary[];
};

export type SpeakingTurnSummary = {
  id: string;
  part: SpeakingPart;
  question: string;
  transcript: string;
  estimatedBand: number | null;
  durationSeconds: number;
  createdAt: string | Date;
  feedbackJson?: SpeakingFeedback | null;
};

export type CreateSessionResponse = {
  session: SessionSummary;
};
