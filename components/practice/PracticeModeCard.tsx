"use client";

import { CheckCircle2 } from "lucide-react";
import type { PracticeMode } from "@/lib/ielts/sessionMachine";

type Props = {
  mode: PracticeMode;
  title: string;
  description: string;
  selected: boolean;
  onSelect: (mode: PracticeMode) => void;
};

export function PracticeModeCard({ mode, title, description, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(mode)}
      className={`focus-ring soft-card min-h-32 p-5 text-left transition hover:-translate-y-0.5 ${
        selected ? "border-[var(--magenta)] ring-2 ring-pink-100" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--navy)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {selected ? <CheckCircle2 className="text-[var(--magenta)]" size={20} /> : null}
      </div>
    </button>
  );
}
