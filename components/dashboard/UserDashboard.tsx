"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BandTrendChart } from "@/components/dashboard/BandTrendChart";
import { SkillRadar } from "@/components/dashboard/SkillRadar";

type Metrics = {
  avgBand: number;
  totalSessions: number;
  totalSpeakingMinutes: number;
  recentSessions: Array<{ finalBand: number | null; topic: string }>;
};

const fallback: Metrics = {
  avgBand: 0,
  totalSessions: 0,
  totalSpeakingMinutes: 0,
  recentSessions: []
};

export function UserDashboard({ name }: { name: string }) {
  const [metrics, setMetrics] = useState<Metrics>(fallback);

  useEffect(() => {
    fetch("/api/progress")
      .then((response) => response.json())
      .then((data) => setMetrics(data.metrics ?? fallback))
      .catch(() => setMetrics(fallback));
  }, []);

  const score = metrics.avgBand || 6.5;
  const trend = metrics.recentSessions.map((session, index) => ({
    name: `S${index + 1}`,
    band: session.finalBand ?? score
  }));

  return (
    <main className="lab-shell py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--magenta)]">Learner dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--navy)]">Welcome back, {name}</h1>
        </div>
        <Link href="/practice" className="rounded-md bg-[var(--magenta)] px-4 py-3 font-semibold text-white">
          Continue practice <ArrowRight className="ml-2 inline" size={16} />
        </Link>
      </div>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Metric label="Average band" value={metrics.avgBand ? metrics.avgBand.toFixed(1) : "-"} />
        <Metric label="Sessions" value={String(metrics.totalSessions)} />
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
              { skill: "Fluency", band: score },
              { skill: "Lexical", band: Math.max(score - 0.2, 0) },
              { skill: "Grammar", band: Math.max(score - 0.4, 0) },
              { skill: "Pronunciation", band: score }
            ]}
          />
        </div>
      </section>
      <section className="soft-card mt-6 p-5">
        <h2 className="font-semibold text-[var(--navy)]">Recommended next practice</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Do a Part 3 discussion after your next Part 1 warmup. Aim for reason, example, contrast, and a clean final sentence.
        </p>
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
