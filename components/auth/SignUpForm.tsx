"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { TargetBandSelector } from "@/components/practice/TargetBandSelector";

export function SignUpForm() {
  const router = useRouter();
  const [targetBand, setTargetBand] = useState(7);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await signUp.email({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
        targetBand
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to create account.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Cannot reach the auth server. Please refresh and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="soft-card mx-auto w-full max-w-md space-y-4 p-6">
      <div>
        <p className="text-sm font-semibold uppercase text-[var(--magenta)]">Create account</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--navy)]">Start your speaking lab</h1>
      </div>
      <Field name="name" label="Name" type="text" />
      <Field name="email" label="Email" type="email" />
      <Field name="password" label="Password" type="password" />
      <TargetBandSelector value={targetBand} onChange={setTargetBand} />
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button disabled={loading} className="focus-ring w-full rounded-md bg-[var(--magenta)] px-4 py-3 font-semibold text-white">
        {loading ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : <UserPlus className="mr-2 inline" size={16} />}
        Create account
      </button>
      <p className="text-center text-sm text-slate-600">
        Already have an account? <Link className="font-semibold text-[var(--magenta)]" href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}

function Field({ name, label, type }: { name: string; label: string; type: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--navy)]">{label}</span>
      <input
        required
        name={name}
        type={type}
        className="focus-ring mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-sm"
      />
    </label>
  );
}
