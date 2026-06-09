"use client";

import { create } from "zustand";
import {
  buildPlannedQuestions,
  type PlannedQuestion,
  type PracticeMode,
  type SpeakingPart
} from "@/lib/ielts/sessionMachine";
import type { RealtimeLog, RealtimeStatus } from "@/lib/realtime/realtimeEvents";
import type { CandidateTurnAudio } from "@/lib/scoring/audioMetrics";
import type { SpeakingFeedback } from "@/lib/scoring/feedbackSchema";

export type PracticeTurn = {
  part: SpeakingPart;
  question: string;
  transcript: string;
  audio?: CandidateTurnAudio;
  feedback?: SpeakingFeedback;
};

type PracticeState = {
  sessionId?: string;
  mode: PracticeMode;
  part: SpeakingPart;
  topic: string;
  targetBand: number;
  currentQuestion: string;
  transcript: string;
  plannedQuestions: PlannedQuestion[];
  activeQuestionIndex: number;
  turns: PracticeTurn[];
  feedbacks: SpeakingFeedback[];
  realtimeStatus: RealtimeStatus;
  elapsedSeconds: number;
  micMuted: boolean;
  debugEvents: RealtimeLog[];
  finalReportReady: boolean;
  errorMessage?: string;
  setSession: (sessionId: string, mode: PracticeMode, topic: string, targetBand: number) => void;
  setStatus: (status: RealtimeStatus) => void;
  setQuestion: (question: string, part?: SpeakingPart) => void;
  appendTranscript: (delta: string) => void;
  setTranscript: (transcript: string) => void;
  clearTranscript: () => void;
  addFeedback: (feedback: SpeakingFeedback) => void;
  addTurn: (turn: PracticeTurn) => void;
  advanceQuestion: () => PlannedQuestion | undefined;
  setMicMuted: (muted: boolean) => void;
  setFinalReportReady: (ready: boolean) => void;
  setErrorMessage: (message?: string) => void;
  tick: () => void;
  addDebugEvent: (event: RealtimeLog) => void;
  reset: () => void;
};

const initialQuestions = buildPlannedQuestions("PART1", "Work or study");

const initial = {
  mode: "PART1" as PracticeMode,
  part: "PART1" as SpeakingPart,
  topic: "Work or study",
  targetBand: 7,
  currentQuestion: initialQuestions[0]?.question ?? "Tell me about your work or studies.",
  transcript: "",
  plannedQuestions: initialQuestions,
  activeQuestionIndex: 0,
  turns: [] as PracticeTurn[],
  feedbacks: [] as SpeakingFeedback[],
  realtimeStatus: "idle" as RealtimeStatus,
  elapsedSeconds: 0,
  micMuted: false,
  debugEvents: [] as RealtimeLog[],
  finalReportReady: false,
  errorMessage: undefined as string | undefined
};

export const usePracticeStore = create<PracticeState>((set) => ({
  ...initial,
  setSession: (sessionId, mode, topic, targetBand) =>
    set((state) => {
      const plannedQuestions = buildPlannedQuestions(mode, topic);
      const firstQuestion = plannedQuestions[0];
      const part = firstQuestion?.part ?? (mode === "PART2" ? "PART2" : mode === "PART3" ? "PART3" : "PART1");
      if (
        state.sessionId === sessionId &&
        state.mode === mode &&
        state.topic === topic &&
        state.targetBand === targetBand &&
        state.part === part
      ) {
        return state;
      }

      return {
        sessionId,
        mode,
        topic,
        targetBand,
        part,
        plannedQuestions,
        activeQuestionIndex: 0,
        currentQuestion: firstQuestion?.question ?? "Tell me about your work or studies.",
        transcript: "",
        turns: [],
        feedbacks: [],
        elapsedSeconds: 0,
        realtimeStatus: "idle",
        finalReportReady: false,
        errorMessage: undefined
      };
    }),
  setStatus: (realtimeStatus) => set({ realtimeStatus }),
  setQuestion: (currentQuestion, part) => set(part ? { currentQuestion, part } : { currentQuestion }),
  appendTranscript: (delta) => set((state) => ({ transcript: state.transcript + delta })),
  setTranscript: (transcript) => set({ transcript }),
  clearTranscript: () => set({ transcript: "" }),
  addFeedback: (feedback) =>
    set((state) => ({
      feedbacks: [feedback, ...state.feedbacks],
      realtimeStatus: "feedback_ready",
      finalReportReady: true
    })),
  addTurn: (turn) => set((state) => ({ turns: [...state.turns, turn], transcript: "" })),
  advanceQuestion: () => {
    let nextQuestion: PlannedQuestion | undefined;
    set((state) => {
      const nextIndex = state.activeQuestionIndex + 1;
      nextQuestion = state.plannedQuestions[nextIndex];
      if (!nextQuestion) {
        return state;
      }

      return {
        activeQuestionIndex: nextIndex,
        part: nextQuestion.part,
        currentQuestion: nextQuestion.question,
        transcript: ""
      };
    });
    return nextQuestion;
  },
  setMicMuted: (micMuted) => set({ micMuted }),
  setFinalReportReady: (finalReportReady) => set({ finalReportReady }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  tick: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
  addDebugEvent: (event) =>
    set((state) => ({ debugEvents: [event, ...state.debugEvents].slice(0, 120) })),
  reset: () => set(initial)
}));
