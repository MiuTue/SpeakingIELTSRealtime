"use client";

import type { SpeakingFeedback } from "@/lib/scoring/feedbackSchema";

type Props = {
  feedbacks: SpeakingFeedback[];
  examMode: boolean;
  finalReady: boolean;
};

export function FeedbackPanel({ feedbacks, examMode, finalReady }: Props) {
  if (examMode && !finalReady) {
    return (
      <aside className="soft-card p-5">
        <h2 className="font-semibold text-[var(--navy)]">Feedback locked</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Exam mode keeps feedback hidden until the final report.
        </p>
      </aside>
    );
  }

  const latest = feedbacks[0];

  return (
    <aside className="soft-card p-5">
      <h2 className="font-semibold text-[var(--navy)]">Speaking feedback</h2>
      {!latest ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your band estimate and corrections will appear once you end the session.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-md bg-[var(--navy)] p-4 text-white">
            <p className="text-sm opacity-80">Estimated band</p>
            <p className="text-4xl font-semibold">{latest.estimated_band.toFixed(1)}</p>
          </div>
          {latest.concise_feedback ? (
            <div className="rounded-md bg-white p-3 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-[var(--navy)]">Summary</p>
              <p className="mt-1">{latest.concise_feedback}</p>
            </div>
          ) : null}
          <Skill label="Fluency & Coherence" skill={latest.fluency_coherence} />
          <Skill label="Lexical Resource" skill={latest.lexical_resource} />
          <Skill label="Grammar" skill={latest.grammar_range_accuracy} />
          <Skill
            label="Pronunciation"
            skill={{
              ...latest.pronunciation,
              feedback: `${latest.pronunciation.feedback} ${latest.pronunciation.note ? `(${latest.pronunciation.note})` : ""}`
            }}
          />
          <AudioAnalysis feedback={latest} />
          <PartDiagnostics feedback={latest} />
          <Corrections feedback={latest} />
          <DetailedCoaching feedback={latest} />
        </div>
      )}
    </aside>
  );
}

function AudioAnalysis({ feedback }: { feedback: SpeakingFeedback }) {
  const analysis = feedback.audio_analysis;
  if (!analysis || analysis.status === "unavailable") return null;

  return (
    <div className="rounded-md border border-[var(--line)] bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-[var(--navy)]">Audio analysis</p>
        <span className="rounded bg-teal-50 px-2 py-1 text-xs font-semibold uppercase text-teal-800">
          {analysis.status}
        </span>
      </div>
      <p className="mt-2 leading-5 text-slate-600">{analysis.summary}</p>
      {analysis.metrics ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          WPM {analysis.metrics.estimatedWpm.toFixed(1)} · pause ratio {(analysis.metrics.pauseRatio * 100).toFixed(0)}% · long pauses {analysis.metrics.longPauseCount}
        </p>
      ) : null}
      {analysis.observations.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-600">
          {analysis.observations.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

function PartDiagnostics({ feedback }: { feedback: SpeakingFeedback }) {
  if (feedback.part_diagnostics.length === 0) return null;

  return (
    <div className="rounded-md border border-[var(--line)] bg-white p-3 text-sm">
      <p className="font-semibold text-[var(--navy)]">Part diagnostics</p>
      <div className="mt-2 space-y-2">
        {feedback.part_diagnostics.map((part) => (
          <div key={part.part} className="rounded bg-slate-50 p-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-700">{part.part.replace("PART", "Part ")}</p>
              <span className="text-xs font-semibold text-[var(--magenta)]">{part.estimated_band.toFixed(1)}</span>
            </div>
            <p className="mt-1 leading-5 text-slate-600">{part.summary}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Part diagnostics are practice estimates, not official IELTS part band scores.
      </p>
    </div>
  );
}

function Skill({
  label,
  skill
}: {
  label: string;
  skill: { band: number; feedback: string; evidence: string[]; limitations: string[] };
}) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--navy)]">{label}</p>
        <span className="rounded bg-pink-50 px-2 py-1 text-xs font-semibold text-[var(--magenta)]">
          {skill.band.toFixed(1)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-5 text-slate-600">{skill.feedback}</p>
      {skill.evidence.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-500">
          {skill.evidence.slice(0, 2).map((evidence) => <li key={evidence}>{evidence}</li>)}
        </ul>
      ) : null}
      {skill.limitations.length > 0 ? (
        <p className="mt-2 text-xs leading-5 text-amber-700">{skill.limitations.join(" ")}</p>
      ) : null}
    </div>
  );
}

function Corrections({ feedback }: { feedback: SpeakingFeedback }) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="font-semibold text-[var(--navy)]">Mistake corrections</p>
        {feedback.mistakes.slice(0, 2).map((mistake) => (
          <p key={mistake.original} className="mt-2 rounded-md bg-white p-3 text-slate-600">
            <span className="font-semibold text-red-600">{mistake.original}</span> →{" "}
            <span className="font-semibold text-emerald-700">{mistake.correction}</span>
          </p>
        ))}
      </div>
      <div className="rounded-md bg-white p-3">
        <p className="font-semibold text-[var(--navy)]">Better answer</p>
        <p className="mt-2 leading-5 text-slate-600">{feedback.better_answer}</p>
      </div>
      <div className="rounded-md bg-teal-50 p-3 text-teal-950">
        <p className="font-semibold">Next step</p>
        <p className="mt-1">{feedback.next_step}</p>
      </div>
    </div>
  );
}

function DetailedCoaching({ feedback }: { feedback: SpeakingFeedback }) {
  const coaching = feedback.detailed_coaching;
  const items = [
    ...coaching.fluency_drills.map((text) => ({ label: "Fluency", text })),
    ...coaching.pronunciation_tips.map((text) => ({ label: "Pronunciation", text })),
    ...coaching.grammar_focus.map((text) => ({ label: "Grammar", text })),
    ...coaching.vocabulary_upgrades.map((text) => ({ label: "Vocabulary", text }))
  ];

  if (items.length === 0 && !coaching.better_response_strategy) return null;

  return (
    <div className="rounded-md bg-white p-3 text-sm">
      <p className="font-semibold text-[var(--navy)]">Detailed coaching</p>
      {coaching.better_response_strategy ? (
        <p className="mt-2 leading-5 text-slate-600">{coaching.better_response_strategy}</p>
      ) : null}
      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.slice(0, 5).map((item) => (
            <p key={`${item.label}-${item.text}`} className="rounded bg-slate-50 p-2 leading-5 text-slate-600">
              <span className="font-semibold text-slate-800">{item.label}: </span>
              {item.text}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
