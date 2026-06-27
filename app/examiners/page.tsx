import Link from "next/link";
import { 
  Volume2, 
  Sparkles, 
  Award, 
  MessageSquare,
  Globe,
  ArrowRight,
  TrendingUp
} from "lucide-react";

const examiners = [
  {
    id: "james",
    name: "Examiner James",
    accent: "British English",
    speed: "Normal (Standard)",
    tone: "Encouraging & Patient",
    desc: "James focuses on helping candidates build speaking confidence. He speaks with a clear, standard Southern British accent and gives you time to formulate complex answers.",
    focus: "Pronunciation & Coherence",
    tag: "Highly Recommended",
    gradient: "from-blue-500 to-indigo-600"
  },
  {
    id: "sarah",
    name: "Examiner Sarah",
    accent: "American English",
    speed: "Slightly Fast",
    tone: "Formal & Academic",
    desc: "Sarah simulates strict test-center conditions. She focuses on lexical diversity and grammatical accuracy, pushing you to explain your ideas with high-level vocabulary.",
    focus: "Vocabulary & Grammar precision",
    tag: "Simulated Exam Mode",
    gradient: "from-[var(--magenta)] to-purple-600"
  },
  {
    id: "liam",
    name: "Examiner Liam",
    accent: "Australian English",
    speed: "Normal",
    tone: "Casual & Friendly",
    desc: "Liam has a warm, relaxed Australian accent. He is perfect for practicing natural conversational pacing, reducing test anxiety, and learning idiomatic expressions.",
    focus: "Fluency & Idiomatic language",
    tag: "Stress-Free Prep",
    gradient: "from-teal-500 to-emerald-600"
  },
  {
    id: "sophia",
    name: "Examiner Sophia",
    accent: "Canadian English",
    speed: "Normal",
    tone: "Analytical & Strict",
    desc: "Sophia is tailored for advanced candidates. She evaluates your speaking coherence under pressure and asks challenging Part 3 follow-up questions to test your critical thinking.",
    focus: "Part 3 Analytical Arguments",
    tag: "Challenging (Band 8.0+)",
    gradient: "from-amber-500 to-orange-600"
  }
];

export default function ExaminersPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] py-16 px-4 sm:px-6 lg:px-8 relative bg-transparent">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--magenta)] bg-pink-500/10 px-3.5 py-1.5 rounded-full w-max mx-auto flex items-center gap-1.5">
            👥 Meet the Team
          </p>
          <h1 className="text-4xl font-extrabold text-[var(--navy)] sm:text-5xl tracking-tight leading-tight">
            Choose your perfect <span className="bg-gradient-to-r from-[var(--magenta)] to-[var(--violet)] bg-clip-text text-transparent">AI IELTS Examiner</span>
          </h1>
          <p className="text-lg text-slate-600">
            Practice with multiple accents, speech tempos, and testing personalities to prepare yourself for any examiner in the real speaking test.
          </p>
        </div>

        {/* Examiners Grid */}
        <div className="grid gap-8 md:grid-cols-2 mt-12">
          {examiners.map((ex) => (
            <div 
              key={ex.id}
              className="soft-card bg-white/70 backdrop-blur-xl border border-slate-200/50 p-8 rounded-2xl flex flex-col justify-between hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
            >
              {/* Top tag */}
              <span className="absolute top-4 right-4 bg-slate-900/5 text-slate-700 text-[10px] font-bold uppercase px-2.5 py-1 rounded-md tracking-wider">
                {ex.tag}
              </span>

              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <div className={`size-14 rounded-2xl bg-gradient-to-tr ${ex.gradient} flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/10`}>
                    {ex.name.split(" ")[1][0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--navy)]">{ex.name}</h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Globe size={12} className="text-slate-400" />
                      <span>{ex.accent}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-600">{ex.desc}</p>

                {/* Parameters list */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Speech Speed</span>
                    <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                      <Volume2 size={14} className="text-slate-400" />
                      <span>{ex.speed}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Personality</span>
                    <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                      <MessageSquare size={14} className="text-slate-400" />
                      <span>{ex.tone}</span>
                    </div>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Best For</span>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Award size={14} className="text-[var(--magenta)]" />
                      <span>{ex.focus}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4">
                <Link 
                  href="/practice"
                  className="focus-ring w-full rounded-xl bg-gradient-to-r from-[var(--magenta)] to-[var(--violet)] py-3 px-4 font-bold text-white shadow-md shadow-pink-500/10 hover:brightness-105 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>Practice with {ex.name.split(" ")[1]}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Global Features Banner */}
        <div className="soft-card bg-slate-900 p-8 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden mt-16 shadow-xl shadow-slate-900/10">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-violet-500/10 opacity-30 pointer-events-none" />
          <div className="space-y-2 relative">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-pink-400" size={20} />
              Want to customize your own examiner?
            </h3>
            <p className="text-sm text-slate-300 max-w-xl">
              Pro members can adjust talking speeds, accent mixes, and even specify the strictness level of the vocabulary feedback report.
            </p>
          </div>
          <Link 
            href="/practice"
            className="rounded-xl bg-white px-6 py-3 font-bold text-slate-950 shadow-md hover:bg-slate-50 active:scale-95 transition-all duration-200 shrink-0 relative flex items-center gap-2"
          >
            <TrendingUp size={16} className="text-[var(--magenta)]" />
            <span>Customize Now</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
