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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this speaking session? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert("Failed to delete the session. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete the session. Please try again.");
    }
  };

  return (
    <>
      {error ? <p className="soft-card p-5 text-sm text-slate-600">{error}</p> : null}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} onDelete={handleDelete} />
        ))}
      </section>
      {!sessions.length && !error ? (
        <p className="soft-card p-5 text-sm text-slate-600">No saved sessions yet.</p>
      ) : null}
    </>
  );
}
