"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PracticeModeCard } from "@/components/practice/PracticeModeCard";
import { TargetBandSelector } from "@/components/practice/TargetBandSelector";
import { TopicSelector } from "@/components/practice/TopicSelector";
import { VoiceSelector } from "@/components/practice/VoiceSelector";
import { allTopics, defaultTopicForMode } from "@/lib/ielts/topics";
import type { PracticeMode } from "@/lib/ielts/sessionMachine";
import { defaultRealtimeVoice, type RealtimeVoice } from "@/lib/realtime/voices";

const modes: Array<{ mode: PracticeMode; title: string; description: string }> = [
  { mode: "PART1", title: "Part 1 Practice", description: "Short personal questions with feedback after each answer." },
  { mode: "PART2", title: "Part 2 Cue Card", description: "Cue card, preparation time, and a longer structured answer." },
  { mode: "PART3", title: "Part 3 Discussion", description: "Abstract follow-ups and deeper IELTS-style discussion." },
  { mode: "FULL_TEST", title: "Full Speaking Test", description: "Exam-like Part 1 to Part 3 flow with final report only." },
  { mode: "CUSTOM", title: "Custom Topic", description: "Practice a flexible topic with the same examiner behavior." }
];

export function PracticeSelection() {
  const router = useRouter();
  const [mode, setMode] = useState<PracticeMode>("PART1");
  const [topic, setTopic] = useState(defaultTopicForMode("PART1"));
  const [targetBand, setTargetBand] = useState(7);
  const [voice, setVoice] = useState<RealtimeVoice>(defaultRealtimeVoice);
  const [customTopic, setCustomTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const topics = useMemo(() => allTopics[mode], [mode]);
  const finalTopic = mode === "CUSTOM" ? customTopic || "Custom IELTS topic" : topic;

  function selectMode(nextMode: PracticeMode) {
    setMode(nextMode);
    setTopic(defaultTopicForMode(nextMode));
  }

  async function startSession() {
    setLoading(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, topic: finalTopic, targetBand })
      });
      if (!response.ok) {
        throw new Error("Failed to create speaking session");
      }
      const data = await response.json();
      router.push(roomUrl(data.session.id));
    } catch (error) {
      console.error(error);
      alert("Error starting live session. Please check your database connection.");
    } finally {
      setLoading(false);
    }
  }

  function roomUrl(sessionId: string) {
    const params = new URLSearchParams({ mode, topic: finalTopic, targetBand: String(targetBand), voice });
    return `/practice/${sessionId}?${params.toString()}`;
  }

  return (
    <main className="lab-shell py-10">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase text-[var(--magenta)]">Practice setup</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--navy)]">Choose your IELTS speaking lab</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Pick a mode, topic, and target band to start your live practice session.
        </p>
      </div>
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {modes.map((item) => (
          <PracticeModeCard key={item.mode} {...item} selected={item.mode === mode} onSelect={selectMode} />
        ))}
      </section>
      <section className="soft-card mt-8 grid gap-5 p-5 md:grid-cols-4">
        {mode === "CUSTOM" ? (
          <label className="block">
            <span className="text-sm font-semibold text-[var(--navy)]">Custom topic</span>
            <input
              value={customTopic}
              onChange={(event) => setCustomTopic(event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-[var(--line)] px-3 py-3 text-sm"
              placeholder="e.g. remote work"
            />
          </label>
        ) : (
          <TopicSelector topics={topics} value={topic} onChange={setTopic} />
        )}
        <TargetBandSelector value={targetBand} onChange={setTargetBand} />
        <VoiceSelector value={voice} onChange={setVoice} />
        <div className="flex items-end">
          <button
            disabled={loading}
            onClick={() => void startSession()}
            className="focus-ring w-full rounded-md bg-[var(--magenta)] px-4 py-3 font-semibold text-white"
          >
            Start live
          </button>
        </div>
      </section>
    </main>
  );
}
