const faqs = [
  ["Can I use a cloned voice?", "Not in v1. Live uses approved OpenAI preset voices and discloses AI-generated audio."],
  ["Is feedback shown during exam mode?", "No. Full test mode hides feedback until the session ends."],
  ["Do I need an account?", "Yes. Practice history, dashboard, and realtime sessions are tied to your account."]
];

export default function FAQPage() {
  return (
    <main className="lab-shell py-10">
      <p className="text-sm font-semibold uppercase text-[var(--magenta)]">FAQ</p>
      <h1 className="mt-3 text-4xl font-semibold text-[var(--navy)]">Common questions</h1>
      <section className="mt-8 space-y-3">
        {faqs.map(([question, answer]) => (
          <div key={question} className="soft-card p-5">
            <h2 className="font-semibold text-[var(--navy)]">{question}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
