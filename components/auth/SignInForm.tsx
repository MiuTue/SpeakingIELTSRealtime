"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { signIn } from "@/lib/auth-client";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await signIn.email({
        email: String(form.get("email")),
        password: String(form.get("password"))
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to sign in.");
        setLoading(false);
        return;
      }

      const profile = await fetch("/api/me").then((response) => response.json());
      router.push(profile.user?.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch {
      setError("Cannot reach the auth server. Please refresh and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="soft-card mx-auto w-full max-w-md space-y-4 p-6">
      <div>
        <p className="text-sm font-semibold uppercase text-[var(--magenta)]">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--navy)]">Sign in to SpeakIELTS AI</h1>
      </div>
      <Field name="email" label="Email" type="email" />
      <Field name="password" label="Password" type="password" />
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button disabled={loading} className="focus-ring w-full rounded-md bg-[var(--magenta)] px-4 py-3 font-semibold text-white">
        {loading ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : <LogIn className="mr-2 inline" size={16} />}
        Sign in
      </button>
      <p className="text-center text-sm text-slate-600">
        New here? <Link className="font-semibold text-[var(--magenta)]" href="/sign-up">Create an account</Link>
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
