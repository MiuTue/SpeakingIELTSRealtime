"use client";

type Props = {
  seconds: number;
};

export function SpeakingTimer({ seconds }: Props) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="rounded-md border border-[var(--line)] bg-white px-3 py-2">
      <p className="text-xs uppercase text-slate-500">Timer</p>
      <p className="text-xl font-semibold text-[var(--navy)]">
        {mins}:{secs}
      </p>
    </div>
  );
}
