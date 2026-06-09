"use client";

import { useEffect, useState } from "react";
import { SessionCard } from "@/components/history/SessionCard";
import type { SessionSummary } from "@/lib/types";

export function HistoryList() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/sessions")
      .then((response) => response.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => setError("History could not be loaded."));
  }, []);

  return (
    <>
      {error ? <p className="soft-card p-5 text-sm text-slate-600">{error}</p> : null}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </section>
      {!sessions.length && !error ? (
        <p className="soft-card p-5 text-sm text-slate-600">No saved sessions yet.</p>
      ) : null}
    </>
  );
}
