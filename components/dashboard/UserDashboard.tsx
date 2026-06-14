"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";
import { BandTrendChart } from "@/components/dashboard/BandTrendChart";
import { SkillRadar } from "@/components/dashboard/SkillRadar";

type Metrics = {
  avgBand: number;
  totalSessions: number;
  totalSpeakingMinutes: number;
  recentSessions: Array<{
    id: string;
    finalBand: number | null;
    topic: string;
    mode: string;
    status: string;
    startedAt: string;
  }>;
  subSkills?: {
    fluency: number;
    lexical: number;
    grammar: number;
    pronunciation: number;
  } | null;
};

const fallback: Metrics = {
  avgBand: 0,
  totalSessions: 0,
  totalSpeakingMinutes: 0,
  recentSessions: [],
  subSkills: null
};

export function UserDashboard({ name }: { name: string }) {
  const [metrics, setMetrics] = useState<Metrics>(fallback);

  const fetchMetrics = () => {
    fetch("/api/progress")
      .then((response) => response.json())
      .then((data) => setMetrics(data.metrics ?? fallback))
      .catch(() => setMetrics(fallback));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this speaking session? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        fetchMetrics();
      } else {
        alert("Failed to delete the session. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete the session. Please try again.");
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Polling hook when there is an evaluating session
  useEffect(() => {
    const hasScoring = metrics.recentSessions.some((s) => s.status === "SCORING");
    if (!hasScoring) return;

    const interval = setInterval(() => {
      fetch("/api/progress")
        .then((response) => response.json())
        .then((data) => setMetrics(data.metrics ?? fallback))
        .catch(() => undefined);
    }, 5000);

    return () => clearInterval(interval);
  }, [metrics.recentSessions]);

  const score = metrics.avgBand || 6.5;
  const trend = metrics.recentSessions
    .filter((s) => s.finalBand !== null)
    .map((session, index) => ({
      name: `S${index + 1}`,
      band: session.finalBand ?? score
    }));

  const subSkillsData = metrics.subSkills ?? {
    fluency: score,
    lexical: Math.max(score - 0.2, 0),
    grammar: Math.max(score - 0.4, 0),
    pronunciation: score
  };

  return (
    <main className="lab-shell py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--magenta)]">Learner dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--navy)]">Welcome back, {name}</h1>
        </div>
        <Link href="/practice" className="rounded-md bg-[var(--magenta)] px-4 py-3 font-semibold text-white hover:opacity-90 transition-opacity">
          Continue practice <ArrowRight className="ml-2 inline" size={16} />
        </Link>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Metric label="Average band" value={metrics.avgBand ? metrics.avgBand.toFixed(1) : "-"} />
        <Metric label="Sessions completed" value={String(metrics.totalSessions)} />
        <Metric label="Speaking minutes" value={metrics.totalSpeakingMinutes.toFixed(1)} />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="soft-card p-5">
          <h2 className="font-semibold text-[var(--navy)]">Band trend</h2>
          <BandTrendChart data={trend.length ? trend : [{ name: "Start", band: score }]} />
        </div>
        <div className="soft-card p-5">
          <h2 className="font-semibold text-[var(--navy)]">Skill profile</h2>
          <SkillRadar
            data={[
              { skill: "Fluency", band: subSkillsData.fluency },
              { skill: "Lexical", band: subSkillsData.lexical },
              { skill: "Grammar", band: subSkillsData.grammar },
              { skill: "Pronunciation", band: subSkillsData.pronunciation }
            ]}
          />
        </div>
      </section>

      <section className="soft-card mt-6 p-5">
        <h2 className="font-semibold text-[var(--navy)] mb-4">Recent Practice Sessions</h2>
        {metrics.recentSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-sm font-medium">
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Test Mode</th>
                  <th className="py-3 px-4">Band</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentSessions.slice().reverse().map((session) => (
                  <tr key={session.id} className="border-b border-slate-50 text-slate-700 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-medium">{session.topic}</td>
                    <td className="py-3.5 px-4 text-sm text-slate-500">
                      {new Date(session.startedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-600">{session.mode.replace("_", " ")}</td>
                    <td className="py-3.5 px-4 font-semibold text-[var(--navy)]">
                      {session.finalBand !== null ? session.finalBand.toFixed(1) : "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      {session.status === "SCORING" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 animate-pulse">
                          Evaluating
                        </span>
                      ) : session.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-650/10">
                          Scored
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/10">
                          {session.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:text-red-650 hover:bg-slate-50 transition-colors"
                        aria-label="Delete session"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-4">No recent practice sessions found. Start a test to begin!</p>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-semibold text-[var(--navy)]">{value}</p>
    </div>
  );
}
