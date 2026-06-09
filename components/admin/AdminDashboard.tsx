"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Users, Activity, Gauge } from "lucide-react";

type Metrics = {
  totalUsers: number;
  totalSessions: number;
  activeSessions: number;
  avgBand: number;
};

const empty: Metrics = {
  totalUsers: 0,
  totalSessions: 0,
  activeSessions: 0,
  avgBand: 0
};

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>(empty);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((response) => response.json())
      .then((data) => setMetrics(data.metrics ?? empty))
      .catch(() => setMetrics(empty));
  }, []);

  return (
    <main className="lab-shell py-10">
      <p className="text-sm font-semibold uppercase text-[var(--magenta)]">Admin</p>
      <h1 className="mt-3 text-4xl font-semibold text-[var(--navy)]">Platform overview</h1>
      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <Metric icon={Users} label="Users" value={String(metrics.totalUsers)} />
        <Metric icon={BarChart3} label="Sessions" value={String(metrics.totalSessions)} />
        <Metric icon={Activity} label="Active" value={String(metrics.activeSessions)} />
        <Metric icon={Gauge} label="Avg band" value={metrics.avgBand ? metrics.avgBand.toFixed(1) : "-"} />
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Link href="/admin/users" className="soft-card block p-5 transition hover:border-[var(--magenta)]">
          <h2 className="font-semibold text-[var(--navy)]">Manage users</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">View learner accounts, roles, target bands, and session counts.</p>
        </Link>
        <Link href="/admin/sessions" className="soft-card block p-5 transition hover:border-[var(--magenta)]">
          <h2 className="font-semibold text-[var(--navy)]">Review sessions</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Inspect speaking sessions, transcripts, duration, and score summaries.</p>
        </Link>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="soft-card p-5">
      <Icon className="text-[var(--teal)]" size={22} />
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-[var(--navy)]">{value}</p>
    </div>
  );
}
