"use client";

import { useEffect, useMemo, useState } from "react";

type AdminSession = {
  id: string;
  mode: string;
  topic: string;
  status: string;
  finalBand: number | null;
  durationSeconds: number;
  startedAt: string;
  user: { name: string; email: string };
  turns: Array<{ id: string; question: string; transcript: string; estimatedBand: number | null }>;
};

export function AdminSessionsTable() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((response) => response.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => setSessions([]));
  }, []);

  const filtered = useMemo(
    () => sessions.filter((session) => `${session.user.email} ${session.topic}`.toLowerCase().includes(query.toLowerCase())),
    [sessions, query]
  );

  return (
    <section className="soft-card p-5">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search sessions"
        className="focus-ring mb-4 w-full rounded-md border border-[var(--line)] px-3 py-3 text-sm"
      />
      <div className="space-y-3">
        {filtered.map((session) => (
          <details key={session.id} className="rounded-md border border-[var(--line)] bg-white p-4">
            <summary className="cursor-pointer font-semibold text-[var(--navy)]">
              {session.user.email} · {session.mode.replace("_", " ")} · {session.topic}
            </summary>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
              <Metric label="Status" value={session.status} />
              <Metric label="Band" value={session.finalBand ? session.finalBand.toFixed(1) : "-"} />
              <Metric label="Minutes" value={(session.durationSeconds / 60).toFixed(1)} />
              <Metric label="Turns" value={String(session.turns.length)} />
            </div>
            <div className="mt-4 space-y-3">
              {session.turns.map((turn) => (
                <div key={turn.id} className="rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-[var(--navy)]">{turn.question}</p>
                  <p className="mt-1 leading-6 text-slate-600">{turn.transcript}</p>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="font-semibold text-[var(--navy)]">{value}</p>
    </div>
  );
}
