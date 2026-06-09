"use client";

import { useEffect } from "react";
import Link from "next/link";
import { animate, createTimeline, stagger } from "animejs";
import { ArrowRight, CheckCircle2, Headphones, LineChart, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  ["Realtime examiner", "Practice with low-latency voice conversation and interruption-friendly flow."],
  ["IELTS-focused feedback", "Get band estimate, corrections, better answer, and one clear next step."],
  ["Progress dashboard", "Track band movement, speaking minutes, session history, and skill profile."],
  ["Exam mode", "Hide feedback during full tests and review the final report after completion."]
];

export function LandingPage() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    createTimeline({ defaults: { ease: "out(3)", duration: 700 } })
      .add(".hero-kicker, .hero-title, .hero-copy, .hero-actions", { y: [24, 0], opacity: [0, 1], delay: stagger(90) })
      .add(".hero-lab", { scale: [0.96, 1], opacity: [0, 1] }, "-=420");
    animate(".wave-bar", { scaleY: [0.35, 1], alternate: true, loop: true, delay: stagger(45), duration: 900 });
  }, []);

  return (
    <main>
      <section className="lab-shell grid min-h-[calc(100vh-64px)] items-center gap-10 py-12 lg:grid-cols-[1fr_430px]">
        <div>
          <p className="hero-kicker text-sm font-semibold uppercase text-[var(--magenta)] opacity-0">IELTS Speaking AI Lab</p>
          <h1 className="hero-title mt-4 max-w-3xl text-5xl font-semibold leading-tight text-[var(--navy)] opacity-0 md:text-6xl">
            From nervous answers to confident IELTS speaking.
          </h1>
          <p className="hero-copy mt-5 max-w-2xl text-xl leading-9 text-slate-600 opacity-0">
            SpeakIELTS AI gives you exam-like realtime practice, transcript capture, and targeted feedback that helps you improve one answer at a time.
          </p>
          <div className="hero-actions mt-8 flex flex-wrap gap-3 opacity-0">
            <Link href="/sign-up" className="focus-ring rounded-md bg-[var(--magenta)] px-5 py-3 font-semibold text-white">
              Start free practice <ArrowRight size={18} className="ml-2 inline" />
            </Link>
            <Link href="/practice" className="focus-ring rounded-md border border-[var(--line)] bg-white px-5 py-3 font-semibold">
              Try speaking room
            </Link>
          </div>
        </div>
        <div className="hero-lab soft-card p-5 opacity-0">
          <div className="rounded-md bg-slate-950 p-5 text-white">
            <p className="text-sm text-teal-200">Examiner is speaking...</p>
            <p className="mt-4 text-2xl font-semibold">Let’s talk about technology in your daily life.</p>
            <div className="mt-8 flex h-24 items-center gap-1">
              {Array.from({ length: 34 }).map((_, index) => (
                <span key={index} className="wave-bar w-1 origin-center rounded-full bg-pink-300" style={{ height: 18 + ((index * 13) % 52) }} />
              ))}
            </div>
          </div>
        </div>
      </section>
      <Section title="Why speaking practice usually stalls" items={["No realistic pressure", "Feedback arrives too late", "Hard to track progress"]} />
      <HowItWorks />
      <FeatureGrid />
      <PricingTeaser />
      <FAQBlock />
      <section className="bg-[var(--navy)] py-16 text-white">
        <div className="lab-shell flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="text-3xl font-semibold">Ready for your next answer?</h2>
            <p className="mt-2 text-slate-200">Start with Part 1, then build toward a full speaking test.</p>
          </div>
          <Link href="/sign-up" className="rounded-md bg-white px-5 py-3 font-semibold text-[var(--navy)]">Create account</Link>
        </div>
      </section>
    </main>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="lab-shell py-14">
      <h2 className="text-3xl font-semibold text-[var(--navy)]">{title}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {items.map((item) => <div key={item} className="soft-card p-5 font-semibold text-slate-700">{item}</div>)}
      </div>
    </section>
  );
}

function HowItWorks() {
  return <Section title="How it works" items={["Choose mode and topic", "Speak with realtime AI examiner", "Review band feedback and next step"]} />;
}

function FeatureGrid() {
  const icons = [Headphones, Sparkles, LineChart, ShieldCheck];
  return (
    <section className="lab-shell py-14">
      <h2 className="text-3xl font-semibold text-[var(--navy)]">Built for IELTS progress</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {features.map(([title, text], index) => {
          const Icon = icons[index];
          return (
            <div key={title} className="soft-card p-5">
              <Icon className="text-[var(--teal)]" />
              <h3 className="mt-3 font-semibold text-[var(--navy)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PricingTeaser() {
  return <Section title="Simple MVP pricing path" items={["Free mock practice", "Pro realtime sessions", "Team and school admin views"]} />;
}

function FAQBlock() {
  return (
    <section className="lab-shell py-14">
      <h2 className="text-3xl font-semibold text-[var(--navy)]">FAQ</h2>
      <div className="mt-6 grid gap-3">
        {["Is the examiner voice AI-generated?", "Can I clone another person's voice?", "Does exam mode hide feedback?"].map((question) => (
          <div key={question} className="soft-card p-5">
            <CheckCircle2 className="mb-2 text-[var(--teal)]" size={18} />
            <p className="font-semibold text-[var(--navy)]">{question}</p>
            <p className="mt-2 text-sm text-slate-600">Yes for AI disclosure and exam mode. Voice cloning is not enabled in v1.</p>
          </div>
        ))}
      </div>
    </section>
  );
}
