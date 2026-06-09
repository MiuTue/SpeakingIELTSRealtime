"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExaminerPanel } from "@/components/practice/ExaminerPanel";
import { FeedbackPanel } from "@/components/practice/FeedbackPanel";
import { RealtimeDebugPanel } from "@/components/practice/RealtimeDebugPanel";
import { SpeakingTimer } from "@/components/practice/SpeakingTimer";
import { TranscriptPanel } from "@/components/practice/TranscriptPanel";
import { GeminiLiveClient } from "@/lib/realtime/geminiLiveClient";
import { type PracticeMode, type SpeakingPart } from "@/lib/ielts/sessionMachine";
import type { RealtimeVoice } from "@/lib/realtime/voices";
import type { CandidateTurnAudio } from "@/lib/scoring/audioMetrics";
import type { SpeakingFeedback } from "@/lib/scoring/feedbackSchema";
import { usePracticeStore, type PracticeTurn } from "@/store/practiceStore";

type Props = {
  sessionId: string;
  mode: PracticeMode;
  topic: string;
  targetBand: number;
  voice: RealtimeVoice;
};

export function PracticeRoom({ sessionId, mode, topic, targetBand, voice }: Props) {
  const [debugOpen, setDebugOpen] = useState(process.env.NEXT_PUBLIC_REALTIME_DEBUG === "true");
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const finalizingRef = useRef(false);
  const pendingQuestionRef = useRef<{ part: SpeakingPart; question: string } | null>(null);
  const part = usePracticeStore((state) => state.part);
  const currentQuestion = usePracticeStore((state) => state.currentQuestion);
  const transcript = usePracticeStore((state) => state.transcript);
  const turns = usePracticeStore((state) => state.turns);
  const feedbacks = usePracticeStore((state) => state.feedbacks);
  const realtimeStatus = usePracticeStore((state) => state.realtimeStatus);
  const elapsedSeconds = usePracticeStore((state) => state.elapsedSeconds);
  const micMuted = usePracticeStore((state) => state.micMuted);
  const debugEvents = usePracticeStore((state) => state.debugEvents);
  const finalReportReady = usePracticeStore((state) => state.finalReportReady);
  const errorMessage = usePracticeStore((state) => state.errorMessage);
  const setSession = usePracticeStore((state) => state.setSession);
  const setStatus = usePracticeStore((state) => state.setStatus);
  const appendTranscript = usePracticeStore((state) => state.appendTranscript);
  const clearTranscript = usePracticeStore((state) => state.clearTranscript);
  const setQuestion = usePracticeStore((state) => state.setQuestion);
  const addFeedback = usePracticeStore((state) => state.addFeedback);
  const addTurn = usePracticeStore((state) => state.addTurn);
  const setMicMuted = usePracticeStore((state) => state.setMicMuted);
  const setFinalReportReady = usePracticeStore((state) => state.setFinalReportReady);
  const setErrorMessage = usePracticeStore((state) => state.setErrorMessage);
  const tick = usePracticeStore((state) => state.tick);
  const addDebugEvent = usePracticeStore((state) => state.addDebugEvent);
  const examMode = mode === "FULL_TEST";
  const question = realtimeStatus === "examiner_speaking" ? "Examiner is asking..." : currentQuestion;

  useEffect(() => {
    setSession(sessionId, mode, topic, targetBand);
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [sessionId, mode, topic, targetBand, setSession, tick]);

  const statusLabel = useMemo(() => statusCopy(realtimeStatus), [realtimeStatus]);

  async function connectLive() {
    try {
      setErrorMessage(undefined);
      setStatus("connecting");
      const client = new GeminiLiveClient();
      bindClient(client);
      clientRef.current = client;
      await client.connect({ mode, part, topic, targetBand, voice });
      client.startExam();
      setStatus("examiner_speaking");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to start the live room.");
      console.error(error);
    }
  }

  async function handleUserAnswer(answerTranscript: string, audio?: CandidateTurnAudio) {
    const cleanedTranscript = answerTranscript.trim();
    if (!cleanedTranscript) {
      setErrorMessage("No transcript was captured for this answer. Please try speaking again.");
      return;
    }

    const state = usePracticeStore.getState();
    const pendingQuestion = pendingQuestionRef.current ?? {
      part: inferPartForExaminerPrompt(state),
      question: state.currentQuestion
    };
    pendingQuestionRef.current = null;

    const turn: PracticeTurn = {
      part: pendingQuestion.part,
      question: pendingQuestion.question,
      transcript: cleanedTranscript,
      audio
    };
    addTurn(turn);
    void persistTurn(turn);
  }

  async function persistTurn(turn: PracticeTurn) {
    if (sessionId === "mock-session") return;
    await fetch(`/api/sessions/${sessionId}/turns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        part: turn.part,
        question: turn.question,
        transcript: turn.transcript,
        durationSeconds: elapsedSeconds,
        estimatedBand: null,
        feedbackJson: null
      })
    }).catch(() => undefined);
  }

  async function finalizeSession(reason: "manual" | "auto") {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    clientRef.current?.disconnect();
    clientRef.current = null;
    setStatus("ended");

    const state = usePracticeStore.getState();
    const liveTranscript = state.transcript.trim();
    if (liveTranscript) {
      const pendingQuestion = pendingQuestionRef.current;
      if (pendingQuestion) {
        const liveTurn: PracticeTurn = {
          part: pendingQuestion.part,
          question: pendingQuestion.question,
          transcript: liveTranscript
        };
        addTurn(liveTurn);
        await persistTurn(liveTurn);
      }
      pendingQuestionRef.current = null;
      clearTranscript();
    }

    const currentTurns = usePracticeStore.getState().turns;
    if (currentTurns.length === 0) {
      setErrorMessage("Please complete at least one answer before requesting feedback.");
      finalizingRef.current = false;
      return;
    }

    await evaluateSession(currentTurns, reason);
    finalizingRef.current = false;
  }

  async function evaluateSession(currentTurns: PracticeTurn[], reason: "manual" | "auto" = "manual") {
    setStatus("evaluating");
    setErrorMessage(undefined);
    setFinalReportReady(false);

    const dialogue = currentTurns
      .map((turn) => `${turn.part}\nExaminer: ${turn.question}\nCandidate: ${turn.transcript}`)
      .join("\n\n");

    try {
      const response = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: reason === "auto" ? "Full IELTS Speaking Test" : "Practice speaking session",
          transcript: dialogue,
          turns: currentTurns.map((turn) => ({
            part: turn.part,
            question: turn.question,
            transcript: turn.transcript,
            audio: turn.audio
          })),
          mode,
          part: currentTurns.at(-1)?.part ?? part,
          topic,
          targetBand
        })
      });

      if (response.ok) {
        const data = (await response.json()) as { feedback: SpeakingFeedback };
        addFeedback(data.feedback);

        // Update session in the database with the final band
        if (sessionId !== "mock-session") {
          await fetch(`/api/sessions/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "COMPLETED",
              finalBand: data.feedback.estimated_band,
              durationSeconds: elapsedSeconds
            })
          }).catch(() => undefined);
        }
        setFinalReportReady(true);
      } else {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        setErrorMessage(data?.error ?? "Unable to evaluate this session. Please try again.");
        setStatus("error");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to evaluate this session. Please check your connection and try again.");
      setStatus("error");
    }
  }

  function retryScoring() {
    const currentTurns = usePracticeStore.getState().turns;
    if (currentTurns.length === 0) {
      setErrorMessage("Please complete at least one answer before requesting feedback.");
      return;
    }
    void evaluateSession(currentTurns);
  }

  function handleExaminerTurnDone(examinerTranscript: string) {
    const cleanedTranscript = normalizeTranscript(examinerTranscript);
    if (!cleanedTranscript) return;

    const state = usePracticeStore.getState();
    const promptPart = inferPartForExaminerPrompt(state);
    setQuestion(cleanedTranscript, promptPart);

    if (isExaminerClosing(cleanedTranscript)) {
      pendingQuestionRef.current = null;
      void finalizeSession("auto");
      return;
    }

    pendingQuestionRef.current = {
      part: promptPart,
      question: cleanedTranscript
    };
  }

  function bindClient(client: GeminiLiveClient) {
    client.on("connected", () => setStatus("connected"));
    client.on("listening", () => {
      if (!finalizingRef.current) setStatus("listening");
    });
    client.on("examiner_speaking", () => setStatus("examiner_speaking"));
    client.on("user_speech_started", () => setStatus("user_speaking"));
    client.on("transcript_delta", (event) => appendTranscript(event.delta));
    client.on("transcript_done", (event) => void handleUserAnswer(event.transcript, event.audio));
    client.on("examiner_turn_done", (event) => handleExaminerTurnDone(event.transcript));
    client.on("interrupted", () => setStatus("interrupted"));
    client.on("error", (error) => {
      setErrorMessage(error.message);
      setStatus("error");
    });
    client.on("log", addDebugEvent);
  }

  return (
    <main className="lab-shell grid gap-5 py-8 lg:grid-cols-[250px_1fr_340px]">
      <aside className="space-y-4">
        <div className="soft-card space-y-4 p-5">
          <Info label="Mode" value={mode.replace("_", " ")} />
          <Info label="Topic" value={topic} />
          <Info label="Target" value={`Band ${targetBand}`} />
          <Info label="Voice" value={voice} />
          <Info label="Part" value={part.replace("PART", "Part ")} />
          <Info label="Status" value={statusLabel} />
          <SpeakingTimer seconds={elapsedSeconds} />
        </div>
        <RealtimeDebugPanel events={debugEvents} enabled={debugOpen} onToggle={() => setDebugOpen(!debugOpen)} />
      </aside>
      <section className="space-y-5">
        <ExaminerPanel
          question={question}
          topic={topic}
          status={realtimeStatus}
          muted={micMuted}
          isPart2={false}
          liveDisabled={["connecting", "connected", "listening", "examiner_speaking", "user_speaking", "evaluating"].includes(realtimeStatus)}
          onConnect={connectLive}
          onMute={() => {
            clientRef.current?.setMuted(!micMuted);
            setMicMuted(!micMuted);
          }}
          onInterrupt={() => clientRef.current?.interrupt()}
          onEnd={() => void finalizeSession("manual")}
        />
        {errorMessage ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p>{errorMessage}</p>
            {realtimeStatus === "error" && turns.length > 0 ? (
              <button className="mt-2 font-semibold text-red-800 underline" onClick={retryScoring}>
                Retry scoring
              </button>
            ) : null}
          </div>
        ) : null}
        <TranscriptPanel liveTranscript={transcript} turns={turns} />
      </section>
      <FeedbackPanel feedbacks={feedbacks} examMode={examMode} finalReady={finalReportReady} />
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-[var(--navy)]">{value}</p>
    </div>
  );
}

function statusCopy(status: string) {
  const copy: Record<string, string> = {
    connecting: "Connecting...",
    examiner_speaking: "Examiner is speaking",
    listening: "Listening...",
    user_speaking: "User speaking",
    evaluating: "Analyzing answer",
    feedback_ready: "Feedback ready",
    interrupted: "Interrupted",
    error: "Error",
    ended: "Ended",
    idle: "Idle",
    connected: "Connected"
  };
  return copy[status] ?? status;
}

type PracticeSnapshot = ReturnType<typeof usePracticeStore.getState>;

function inferPartForExaminerPrompt(state: PracticeSnapshot): SpeakingPart {
  if (state.mode !== "FULL_TEST") return state.part;

  const lastPlanIndex = Math.max(0, state.plannedQuestions.length - 1);
  const nextPromptIndex = Math.min(state.turns.length, lastPlanIndex);
  return state.plannedQuestions[nextPromptIndex]?.part ?? state.part;
}

function normalizeTranscript(transcript: string) {
  return transcript.replace(/\s+/g, " ").trim();
}

function isExaminerClosing(transcript: string) {
  const normalized = transcript.toLowerCase();
  return (
    normalized.includes("end of the speaking test") ||
    normalized.includes("end of this speaking test") ||
    normalized.includes("that is the end")
  );
}
