import { HistoryList } from "@/components/history/HistoryList";
import { requireUserPage } from "@/lib/server/authGuards";

export default async function HistoryPage() {
  await requireUserPage();

  return (
    <main className="lab-shell py-10">
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase text-[var(--magenta)]">History</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--navy)]">Speaking sessions</h1>
      </div>
      <HistoryList />
    </main>
  );
}
