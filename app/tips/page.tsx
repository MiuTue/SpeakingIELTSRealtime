import Link from "next/link";
import { 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  Mic, 
  BookOpen, 
  FileText,
  ChevronRight,
  Sparkles
} from "lucide-react";

const pillars = [
  {
    title: "Fluency & Coherence",
    metric: "25% of Score",
    desc: "Speak smoothly without long pauses or self-correction. Organize ideas logically using linking words.",
    dos: ["Use filler phrases (e.g. 'That's an interesting question...') instead of silent pauses", "Extend your answers with reasons and examples"],
    donts: ["Don't repeat the same words over and over", "Don't rush; speaking too fast causes pronunciation slips"]
  },
  {
    title: "Lexical Resource",
    metric: "25% of Score",
    desc: "Show a wide vocabulary range, including collocations, idiomatic expressions, and precise academic terms.",
    dos: ["Use synonyms to paraphrase the examiner's questions", "Incorporate collocations naturally (e.g., 'deeply regret', 'make a decision')"],
    donts: ["Don't use overly complex slang if you're unsure of the meaning", "Don't stick to simple words like 'good', 'bad', or 'nice'"]
  },
  {
    title: "Grammatical Range & Accuracy",
    metric: "25% of Score",
    desc: "Produce error-free simple sentences and successfully construct complex sentence structures (e.g., conditionals, passives).",
    dos: ["Mix simple, compound, and complex sentences", "Pay attention to correct verb tenses, especially when talking about the past"],
    donts: ["Don't try to use complex grammar if it causes you to pause frequently", "Don't ignore basic subject-verb agreement"]
  },
  {
    title: "Pronunciation",
    metric: "25% of Score",
    desc: "Speak clearly so you are understood easily. Use appropriate intonation, sentence stress, and sound linking.",
    dos: ["Vary your pitch to sound expressive and convey emotion", "Link words together naturally to sound more native"],
    donts: ["Don't try to fake a foreign accent; clarity is what examiners grade", "Don't swallow word endings (like past tense -ed or plural -s)"]
  }
];

export default function TipsPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] py-16 px-4 sm:px-6 lg:px-8 relative bg-transparent">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-3.5 py-1.5 rounded-full w-max mx-auto flex items-center gap-1.5">
            <Lightbulb size={14} /> Master class
          </p>
          <h1 className="text-4xl font-extrabold text-[var(--navy)] sm:text-5xl tracking-tight leading-tight">
            IELTS Speaking <span className="bg-gradient-to-r from-[var(--magenta)] to-[var(--violet)] bg-clip-text text-transparent">Strategies & Tips</span>
          </h1>
          <p className="text-lg text-slate-600">
            Learn the exact marking rubrics of official examiners and practice with target exercises to boost your fluency and vocabulary.
          </p>
        </div>

        {/* The 4 Pillars */}
        <div className="grid gap-6 lg:grid-cols-2 mt-12">
          {pillars.map((pillar) => (
            <div 
              key={pillar.title}
              className="soft-card bg-white/70 backdrop-blur-xl border border-slate-200/50 p-8 rounded-2xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-[var(--navy)]">{pillar.title}</h2>
                  <span className="text-xs font-bold text-[var(--magenta)] bg-pink-500/10 px-2.5 py-1 rounded-md">
                    {pillar.metric}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{pillar.desc}</p>
                
                {/* Do's & Don'ts */}
                <div className="grid gap-4 md:grid-cols-2 pt-2">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle size={10} /> Do
                    </span>
                    <ul className="space-y-1.5">
                      {pillar.dos.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <ChevronRight size={12} className="text-teal-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                      <XCircle size={10} /> Don&apos;t
                    </span>
                    <ul className="space-y-1.5">
                      {pillar.donts.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <ChevronRight size={12} className="text-rose-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Daily Routine Practice */}
        <div className="soft-card bg-white/70 backdrop-blur-xl border border-slate-200/50 p-8 rounded-2xl mt-12 space-y-8">
          <div className="flex items-center gap-3">
            <Mic className="text-[var(--magenta)]" size={24} />
            <h2 className="text-2xl font-bold text-[var(--navy)]">Our Recommended 15-Minute Daily Routine</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                time: "Minutes 1-5",
                title: "Vocabulary Prep",
                desc: "Choose a topic on SpeakIELTS and read through the related collocations and idioms. Write down 3-5 words you want to target.",
                icon: BookOpen
              },
              {
                time: "Minutes 5-12",
                title: "Realtime Practice",
                desc: "Open a practice session. Speak with the AI Examiner, focus on linking your ideas, and consciously use your target words.",
                icon: Mic
              },
              {
                time: "Minutes 12-15",
                title: "Feedback Review",
                desc: "Check the AI scorecard. Look closely at grammatical slips, pronunciation highlights, and try saying the corrected answers aloud.",
                icon: FileText
              }
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="border border-slate-100 p-5 rounded-xl space-y-3 bg-white/50 relative">
                  <span className="absolute top-4 right-4 text-[10px] font-bold text-[var(--magenta)] tracking-wide">
                    {step.time}
                  </span>
                  <div className="size-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-[var(--magenta)]">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-500">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action banner */}
        <div className="soft-card bg-gradient-to-tr from-[var(--magenta)] to-[var(--violet)] p-8 rounded-2xl text-white text-center space-y-6 shadow-xl shadow-pink-500/10 mt-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl pointer-events-none" />
          <div className="max-w-2xl mx-auto space-y-3 relative">
            <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Sparkles className="text-yellow-300 animate-pulse" size={24} />
              Put these strategies to test!
            </h3>
            <p className="text-sm text-pink-100 leading-relaxed">
              Open a mock test room today. Speak naturally, receive native-level scoring feedback, and see your progress index rise.
            </p>
          </div>
          <div className="relative">
            <Link 
              href="/practice"
              className="inline-flex rounded-xl bg-white px-8 py-3.5 font-bold text-[var(--navy)] shadow-md hover:bg-slate-50 active:scale-95 transition-all duration-200"
            >
              Start Practice Session
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
