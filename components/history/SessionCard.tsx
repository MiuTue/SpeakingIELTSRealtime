import type { SessionSummary } from "@/lib/types";

export function SessionCard({ session }: { session: SessionSummary }) {
  return (
    <article className="soft-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--magenta)]">{session.mode.replace("_", " ")}</p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--navy)]">{session.topic}</h3>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {session.finalBand ? session.finalBand.toFixed(1) : "In progress"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <Metric label="Target" value={String(session.targetBand)} />
        <Metric label="Minutes" value={(session.durationSeconds / 60).toFixed(1)} />
        <Metric label="Turns" value={String(session.turns?.length ?? 0)} />
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="font-semibold text-[var(--navy)]">{value}</p>
    </div>
  );
}
