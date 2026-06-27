"use client";

import { useEffect } from "react";
import Link from "next/link";
import { animate, createTimeline, stagger } from "animejs";
import { 
  ArrowRight, 
  CheckCircle2, 
  Headphones, 
  LineChart, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  AlertCircle,
  Flame,
  Award,
  Zap,
  Check
} from "lucide-react";

const features = [
  {
    title: "Realtime examiner",
    desc: "Practice with low-latency voice conversation and interruption-friendly flow. Feels just like a human conversation.",
    icon: Headphones,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    title: "IELTS-focused feedback",
    desc: "Get band estimate, corrections, better answers, and one clear action step to improve your score.",
    icon: Sparkles,
    color: "text-[var(--magenta)]",
    bgColor: "bg-pink-500/10"
  },
  {
    title: "Progress dashboard",
    desc: "Track band movement, speaking minutes, session history, and skill profile over time.",
    icon: LineChart,
    color: "text-[var(--violet)]",
    bgColor: "bg-purple-500/10"
  },
  {
    title: "Exam mode",
    desc: "Hide feedback during full tests to simulate the actual test pressure, and review the final report after completion.",
    icon: ShieldCheck,
    color: "text-teal-600",
    bgColor: "bg-teal-500/10"
  }
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
    <main className="overflow-hidden bg-transparent">
      {/* Hero Section */}
      <section className="relative lab-shell grid min-h-[calc(100vh-64px)] items-center gap-12 py-16 lg:grid-cols-[1fr_450px]">
        {/* Background decorative glows */}
        <div className="absolute top-1/4 left-1/3 -z-10 h-72 w-72 rounded-full bg-pink-500/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-10 -z-10 h-80 w-80 rounded-full bg-purple-500/5 blur-3xl" />

        <div className="flex flex-col justify-center">
          <p className="hero-kicker text-xs font-bold tracking-wider uppercase text-[var(--magenta)] opacity-0 bg-pink-500/10 px-3.5 py-1.5 rounded-full w-max">
            ⚡ IELTS Speaking AI Lab
          </p>
          <h1 className="hero-title mt-6 text-5xl font-extrabold leading-tight text-[var(--navy)] opacity-0 md:text-6xl tracking-tight">
            From nervous answers to <span className="bg-gradient-to-r from-[var(--magenta)] to-[var(--violet)] bg-clip-text text-transparent">confident IELTS speaking.</span>
          </h1>
          <p className="hero-copy mt-6 text-lg leading-relaxed text-slate-600 opacity-0 max-w-xl">
            SpeakIELTS AI gives you exam-like realtime practice, transcript capture, and targeted feedback that helps you improve one answer at a time.
          </p>
          <div className="hero-actions mt-10 flex flex-wrap gap-4 opacity-0">
            <Link 
              href="/sign-up" 
              className="focus-ring rounded-xl bg-gradient-to-r from-[var(--magenta)] to-[var(--violet)] px-7 py-4 font-bold text-white shadow-lg shadow-pink-500/15 hover:brightness-105 active:scale-95 transition-all duration-200"
            >
              Start free practice <ArrowRight size={18} className="ml-2 inline" />
            </Link>
            <Link 
              href="/practice" 
              className="focus-ring rounded-xl border border-[var(--line)] bg-white/90 backdrop-blur-md px-7 py-4 font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-200"
            >
              Try speaking room
            </Link>
          </div>
        </div>

        {/* AI Examiner Interactive UI Simulator */}
        <div className="hero-lab relative opacity-0">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-[var(--magenta)] to-[var(--violet)] opacity-10 blur-xl" />
          <div className="relative rounded-3xl border border-slate-200/50 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
            {/* Tablet/App bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500"></span>
                </span>
                <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">Examiner James is speaking</p>
              </div>
              <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-300">IELTS Part 1</span>
            </div>

            {/* Prompt Screen */}
            <div className="my-10 flex flex-col justify-center min-h-[120px]">
              <span className="text-xs font-medium text-pink-400 mb-2">Question:</span>
              <p className="text-2xl font-bold leading-relaxed text-slate-100">
                "Let’s talk about technology in your daily life. Do you use it often?"
              </p>
            </div>

            {/* Glowing soundwave */}
            <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
              <div className="flex h-16 items-end justify-between gap-1 px-2">
                {Array.from({ length: 28 }).map((_, index) => (
                  <span 
                    key={index} 
                    className="wave-bar w-1.5 origin-center rounded-full bg-gradient-to-t from-[var(--magenta)] to-pink-300" 
                    style={{ height: 12 + ((index * 17) % 40) }} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hurdles/Why practice stalls Section */}
      <section className="bg-slate-100/40 py-20 border-y border-[var(--line)]">
        <div className="lab-shell">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-[var(--navy)] sm:text-4xl tracking-tight">Why speaking practice usually stalls</h2>
            <p className="mt-4 text-slate-600">Standard IELTS prep methods leave learners with big gaps. Here is why practicing alone is hard.</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "No realistic pressure",
                desc: "Practicing with books doesn't build the stamina needed for the actual 15-minute face-to-face test pressure.",
                color: "border-t-amber-500",
                icon: AlertCircle
              },
              {
                title: "Feedback arrives too late",
                desc: "Without instant corrections, you keep repeating the same grammatical errors and bad pronunciation habits.",
                color: "border-t-[var(--magenta)]",
                icon: Flame
              },
              {
                title: "Hard to track progress",
                desc: "Generic feedback like 'your speaking is good' makes it impossible to know if you are ready for a band 7.0+.",
                color: "border-t-[var(--violet)]",
                icon: Award
              }
            ].map((hurdle) => {
              const Icon = hurdle.icon;
              return (
                <div key={hurdle.title} className={`soft-card border-t-4 ${hurdle.color} p-6 flex flex-col justify-between`}>
                  <div>
                    <Icon className="text-slate-500 mb-3" size={24} />
                    <h3 className="text-lg font-bold text-[var(--navy)]">{hurdle.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{hurdle.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20">
        <div className="lab-shell">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-[var(--navy)] sm:text-4xl tracking-tight">How it works</h2>
            <p className="mt-4 text-slate-600">Simplicity is our priority. Get exam-ready in three simple steps.</p>
          </div>

          <div className="mt-16 relative">
            {/* Visual connector line for desktop */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 hidden md:block -z-10" />

            <div className="grid gap-8 md:grid-cols-3">
              {[
                { step: "1", title: "Choose mode & topic", desc: "Select from Part 1, 2, or 3, select your target band, and pick from IELTS speaking topics." },
                { step: "2", title: "Speak with AI Examiner", desc: "Carry out a natural, real-time voice interview. Pause, interrupt, or review at your own pace." },
                { step: "3", title: "Review band feedback", desc: "Get score estimates for each category and detailed feedback on how to improve your score." }
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center p-4">
                  <span className="flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--magenta)] to-[var(--violet)] text-xl font-bold text-white shadow-md mb-6 ring-8 ring-[#fbfaf7]">
                    {item.step}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--navy)]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 max-w-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rich Features Section */}
      <section className="bg-slate-100/40 py-20 border-t border-[var(--line)]">
        <div className="lab-shell">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-[var(--navy)] sm:text-4xl tracking-tight">Built for IELTS progress</h2>
            <p className="mt-4 text-slate-600">Packed with core practice modules to boost your confidence and speech parameters.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title} 
                  className="soft-card bg-white/60 p-6 backdrop-blur-md hover:-translate-y-0.5 transition-all duration-300 flex items-start gap-4"
                >
                  <span className={`p-3 rounded-xl ${feature.bgColor} ${feature.color} shrink-0`}>
                    <Icon size={24} />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--navy)]">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Premium Pricing Section */}
      <section className="py-20">
        <div className="lab-shell">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-[var(--navy)] sm:text-4xl tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-4 text-slate-600">Choose the practice scope that suits your timeline. Cancel anytime.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 items-stretch max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="soft-card p-8 flex flex-col justify-between border border-slate-200/50 bg-white/70">
              <div>
                <h3 className="text-xl font-bold text-[var(--navy)]">Free Tier</h3>
                <p className="mt-2 text-sm text-slate-500">Perfect to test out the voice platform.</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-[var(--navy)]">$0</span>
                  <span className="ml-1 text-sm text-slate-500">/ forever</span>
                </div>
                <ul className="mt-8 space-y-4">
                  {["Part 1 Practice Only", "Basic Transcripts", "Limited Daily Speaking Time"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="text-teal-600" size={16} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link 
                href="/sign-up" 
                className="mt-8 flex w-full justify-center rounded-xl border border-[var(--line)] py-3 text-center text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="soft-card p-8 flex flex-col justify-between border-2 border-[var(--magenta)] bg-white relative shadow-xl shadow-pink-500/5">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[var(--magenta)] to-[var(--violet)] px-4 py-1 text-xs font-bold text-white uppercase tracking-wider">
                Recommended
              </span>
              <div>
                <h3 className="text-xl font-bold text-[var(--navy)]">Pro Practice</h3>
                <p className="mt-2 text-sm text-slate-500">Unlock full examinations and grading.</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-[var(--navy)]">$19</span>
                  <span className="ml-1 text-sm text-slate-500">/ month</span>
                </div>
                <ul className="mt-8 space-y-4">
                  {[
                    "Full IELTS Speaking Parts 1-3",
                    "Realtime AI voice evaluator",
                    "Detailed score breakdown (pronunciation, grammar, lexical)",
                    "Unlimited practice sessions",
                    "Progress tracking dashboard"
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="text-[var(--magenta)] mt-0.5 shrink-0" size={16} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link 
                href="/sign-up" 
                className="mt-8 flex w-full justify-center rounded-xl bg-gradient-to-r from-[var(--magenta)] to-[var(--violet)] py-3 text-center text-sm font-bold text-white hover:brightness-105 transition-all shadow-md shadow-pink-500/10"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Institutional Plan */}
            <div className="soft-card p-8 flex flex-col justify-between border border-slate-200/50 bg-white/70">
              <div>
                <h3 className="text-xl font-bold text-[var(--navy)]">Institutional</h3>
                <p className="mt-2 text-sm text-slate-500">For language schools and classrooms.</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-[var(--navy)]">Custom</span>
                </div>
                <ul className="mt-8 space-y-4">
                  {["Teacher feedback panels", "Student progress analytics", "Volume license discounts", "Custom voice examiners"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="text-teal-600" size={16} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link 
                href="/sign-up" 
                className="mt-8 flex w-full justify-center rounded-xl border border-[var(--line)] py-3 text-center text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Block */}
      <section className="bg-slate-100/40 py-20 border-t border-[var(--line)]">
        <div className="lab-shell max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[var(--navy)] tracking-tight">Frequently Asked Questions</h2>
            <p className="mt-4 text-slate-600">Have questions? We have answers.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is the examiner voice AI-generated?",
                a: "Yes. We use advanced real-time Text-to-Speech models combined with Gemini's Multimodal voice outputs to simulate actual examiners with distinct accents (British, American, Australian)."
              },
              {
                q: "Does Exam Mode hide live feedback?",
                a: "Absolutely. In Exam Mode, all transcripts, scoring, and corrections are hidden during the practice. You only receive the final detailed scorecard after completing the entire session, simulating actual test-center conditions."
              },
              {
                q: "How accurate is the estimated IELTS band score?",
                a: "Our evaluator is continuously calibrated against official IELTS assessment criteria (Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation). While it serves as a highly reliable gauge, the final score depends on official test-center examiners."
              }
            ].map((faq) => (
              <div key={faq.q} className="soft-card p-6 bg-white border border-slate-200/50">
                <div className="flex items-start gap-3">
                  <HelpCircle className="text-[var(--magenta)] mt-0.5 shrink-0" size={20} />
                  <div>
                    <h3 className="font-bold text-[var(--navy)] text-base">{faq.q}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom Section */}
      <section className="bg-[var(--navy)] py-20 text-white relative">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-violet-500/10 opacity-40" />
        <div className="relative lab-shell flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight">Ready for your next answer?</h2>
            <p className="mt-3 text-slate-300 max-w-xl text-base">
              Start with free mock practice questions in Part 1, build toward full speaking assessments, and track your success.
            </p>
          </div>
          <Link 
            href="/sign-up" 
            className="rounded-xl bg-white px-8 py-4 font-bold text-[var(--navy)] shadow-xl hover:bg-slate-100 active:scale-95 transition-all duration-200 shrink-0"
          >
            Create free account
          </Link>
        </div>
      </section>
    </main>
  );
}
