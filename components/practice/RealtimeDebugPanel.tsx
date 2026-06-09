"use client";

import type { RealtimeLog } from "@/lib/realtime/realtimeEvents";

type Props = {
  events: RealtimeLog[];
  enabled: boolean;
  onToggle: () => void;
};

export function RealtimeDebugPanel({ events, enabled, onToggle }: Props) {
  return (
    <section className="soft-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--navy)]">Realtime debug</h3>
        <button className="rounded-md border px-3 py-1 text-xs" onClick={onToggle}>
          {enabled ? "Hide" : "Show"}
        </button>
      </div>
      {enabled ? (
        <div className="mt-3 max-h-56 space-y-2 overflow-auto text-xs">
          {events.map((event) => (
            <div key={event.id} className="rounded bg-slate-950 p-2 font-mono text-slate-100">
              <span className="text-teal-300">{event.direction}</span> {event.type}
            </div>
          ))}
          {!events.length ? <p className="text-slate-500">No events yet.</p> : null}
        </div>
      ) : null}
    </section>
  );
}
