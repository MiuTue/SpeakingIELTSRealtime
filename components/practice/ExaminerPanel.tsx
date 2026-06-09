"use client";

import { Bot, Mic, MicOff, PhoneOff, Zap } from "lucide-react";
import { WaveformVisualizer } from "@/components/practice/WaveformVisualizer";
import { CueCard } from "@/components/practice/CueCard";
import type { RealtimeStatus } from "@/lib/realtime/realtimeEvents";

type Props = {
  question: string;
  cueCard?: string;
  topic: string;
  status: RealtimeStatus;
  muted: boolean;
  isPart2: boolean;
  liveDisabled: boolean;
  onConnect: () => void;
  onMute: () => void;
  onInterrupt: () => void;
  onEnd: () => void;
};

export function ExaminerPanel(props: Props) {
  const active = ["examiner_speaking", "user_speaking", "listening"].includes(props.status);

  return (
    <section className="soft-card p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-md bg-[var(--navy)] text-white">
          <Bot size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500">AI examiner</p>
          <h2 className="text-lg font-semibold text-[var(--navy)]">Professional IELTS interview</h2>
        </div>
      </div>
      <p className="mt-5 rounded-md bg-white p-4 text-lg font-semibold leading-7 text-slate-900">
        {props.question}
      </p>
      <div className="mt-4">
        <CueCard topic={props.cueCard ?? props.topic} visible={props.isPart2} />
      </div>
      <div className="mt-4">
        <WaveformVisualizer active={active} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="focus-ring rounded-md bg-[var(--magenta)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={props.onConnect}
          disabled={props.liveDisabled}
        >
          <Zap size={16} className="mr-2 inline" />
          {props.liveDisabled ? "Live running" : "Live"}
        </button>
        <button className="focus-ring rounded-md border px-3 py-2 text-sm" onClick={props.onMute}>
          {props.muted ? <MicOff size={16} className="mr-2 inline" /> : <Mic size={16} className="mr-2 inline" />}
          {props.muted ? "Unmute" : "Mute"}
        </button>
        <button className="focus-ring rounded-md border px-3 py-2 text-sm" onClick={props.onInterrupt}>
          Interrupt
        </button>
        <button className="focus-ring rounded-md border px-3 py-2 text-sm" onClick={props.onEnd}>
          <PhoneOff size={16} className="mr-2 inline" />
          End
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        The Live examiner voice is AI-generated using approved preset voices, not a cloned person voice.
      </p>
    </section>
  );
}
