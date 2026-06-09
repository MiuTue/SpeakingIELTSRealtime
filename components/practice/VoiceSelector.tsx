"use client";

import { allowedRealtimeVoices, type RealtimeVoice } from "@/lib/realtime/voices";

type Props = {
  value: RealtimeVoice;
  onChange: (voice: RealtimeVoice) => void;
};

export function VoiceSelector({ value, onChange }: Props) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--navy)]">Examiner voice</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as RealtimeVoice)}
        className="focus-ring mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-sm"
      >
        {allowedRealtimeVoices.map((voice) => (
          <option key={voice} value={voice}>
            {voice}
          </option>
        ))}
      </select>
      <span className="mt-2 block text-xs leading-5 text-slate-500">
        This AI-generated voice uses approved Gemini presets. Custom voice cloning is not enabled in v1.
      </span>
    </label>
  );
}
