"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";
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
    <div className="relative w-full max-w-md mx-auto">
      {/* Decorative colored blur backdrops */}
      <div className="absolute -top-10 -left-10 -z-10 h-40 w-40 rounded-full bg-pink-500/10 blur-2xl" />
      <div className="absolute -bottom-10 -right-10 -z-10 h-40 w-40 rounded-full bg-purple-500/10 blur-2xl" />

      <form 
        onSubmit={onSubmit} 
        className="soft-card bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-2xl shadow-slate-900/10 w-full p-8 rounded-2xl space-y-6"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <div className="size-14 rounded-2xl overflow-hidden shadow-md mb-4 border border-slate-200/30 flex items-center justify-center bg-white">
            <Image 
              src="/logo.png" 
              alt="SpeakIELTS AI Logo" 
              width={56} 
              height={56} 
              className="object-cover"
            />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--magenta)]">SpeakIELTS AI</p>
          <h1 className="mt-2 text-2xl font-extrabold text-[var(--navy)] text-center tracking-tight">Create your account</h1>
          <p className="text-sm text-slate-500 text-center mt-1">Start your AI-powered speaking practice</p>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <Field name="name" label="Full Name" type="text" placeholder="John Doe" />
          <Field name="email" label="Email Address" type="email" placeholder="you@example.com" />
          <Field name="password" label="Password" type="password" placeholder="At least 8 characters" />
          
          <div className="pt-2">
            <label className="block mb-2">
              <span className="text-xs font-bold text-[var(--navy)] tracking-wide uppercase">Target Band Score</span>
            </label>
            <TargetBandSelector value={targetBand} onChange={setTargetBand} />
          </div>
        </div>

        {/* Error Messaging */}
        {error ? (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-4 border border-red-100">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={16} />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        ) : null}

        {/* Submit Button */}
        <button 
          disabled={loading} 
          className="focus-ring w-full rounded-xl bg-gradient-to-r from-[var(--magenta)] to-[var(--violet)] py-3.5 font-bold text-white shadow-lg shadow-pink-500/15 hover:brightness-105 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <UserPlus size={18} />
          )}
          <span>Create Account</span>
        </button>

        {/* Navigation Link */}
        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-bold text-[var(--magenta)] hover:underline" href="/sign-in">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

function Field({ 
  name, 
  label, 
  type, 
  placeholder 
}: { 
  name: string; 
  label: string; 
  type: string; 
  placeholder?: string; 
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[var(--navy)] tracking-wide uppercase">{label}</span>
      <input
        required
        name={name}
        type={type}
        placeholder={placeholder}
        className="focus-ring mt-2 w-full rounded-xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm focus:border-[var(--magenta)] focus:ring-4 focus:ring-pink-500/10 focus:outline-none transition-all duration-200 text-slate-800 placeholder-slate-400"
      />
    </label>
  );
}
