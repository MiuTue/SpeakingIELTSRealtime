"use client";

import { useState } from "react";
import { TargetBandSelector } from "@/components/practice/TargetBandSelector";

type Props = {
  name: string;
  email: string;
  targetBand: number;
};

export function SettingsForm(props: Props) {
  const [name, setName] = useState(props.name);
  const [targetBand, setTargetBand] = useState(props.targetBand);
  const [status, setStatus] = useState("");

  async function save() {
    setStatus("Saving...");
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, targetBand })
    });
    setStatus(response.ok ? "Saved" : "Could not save settings");
  }

  return (
    <section className="soft-card max-w-xl space-y-5 p-5">
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="focus-ring mt-2 w-full rounded-md border border-[var(--line)] px-3 py-3 text-sm"
        />
      </label>
      <div>
        <p className="text-sm font-semibold text-[var(--navy)]">Email</p>
        <p className="mt-2 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-600">{props.email}</p>
      </div>
      <TargetBandSelector value={targetBand} onChange={setTargetBand} />
      <button onClick={() => void save()} className="focus-ring rounded-md bg-[var(--magenta)] px-4 py-3 font-semibold text-white">
        Save settings
      </button>
      {status ? <p className="text-sm text-slate-600">{status}</p> : null}
    </section>
  );
}
