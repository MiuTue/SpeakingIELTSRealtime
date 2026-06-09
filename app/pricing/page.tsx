export default function PricingPage() {
  return (
    <main className="lab-shell py-10">
      <p className="text-sm font-semibold uppercase text-[var(--magenta)]">Pricing</p>
      <h1 className="mt-3 text-4xl font-semibold text-[var(--navy)]">Plans for focused speaking practice</h1>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {["Free", "Pro", "School"].map((plan, index) => (
          <div key={plan} className="soft-card p-5">
            <h2 className="text-xl font-semibold text-[var(--navy)]">{plan}</h2>
            <p className="mt-3 text-3xl font-semibold">{index === 0 ? "$0" : index === 1 ? "$12" : "Custom"}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Realtime IELTS speaking practice, feedback, and progress tracking.</p>
          </div>
        ))}
      </section>
    </main>
  );
}
