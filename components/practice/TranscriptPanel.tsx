"use client";

import type { PracticeTurn } from "@/store/practiceStore";

type Props = {
  liveTranscript: string;
  turns: PracticeTurn[];
};

export function TranscriptPanel({ liveTranscript, turns }: Props) {
  return (
    <section className="rounded-md border border-[var(--line)] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--navy)]">Conversation transcript</h3>
        <span className="text-xs font-semibold text-slate-500">{turns.length} answers</span>
      </div>
      <div className="mt-3 rounded-md bg-teal-50 p-3">
        <p className="text-xs font-semibold uppercase text-teal-800">Live answer</p>
        <p className="mt-2 min-h-12 text-sm leading-6 text-teal-950">
          {liveTranscript || "Your answer transcript will appear here as you speak."}
        </p>
      </div>
      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {turns.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--line)] p-3 text-sm leading-6 text-slate-500">
            Completed answers will be saved here with the examiner question.
          </p>
        ) : (
          turns.map((turn, index) => (
            <article key={`${turn.part}-${index}-${turn.question}`} className="rounded-md border border-[var(--line)] p-3">
              <p className="text-xs font-semibold uppercase text-[var(--magenta)]">{turn.part.replace("PART", "Part ")}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--navy)]">Examiner: {turn.question}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Candidate: {turn.transcript}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
