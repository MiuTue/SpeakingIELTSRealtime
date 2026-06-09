import { AdminSessionsTable } from "@/components/admin/AdminSessionsTable";
import { requireAdminPage } from "@/lib/server/authGuards";

export default async function AdminSessionsPage() {
  await requireAdminPage();
  return (
    <main className="lab-shell py-10">
      <p className="text-sm font-semibold uppercase text-[var(--magenta)]">Admin</p>
      <h1 className="mt-3 text-4xl font-semibold text-[var(--navy)]">Speaking sessions</h1>
      <div className="mt-6">
        <AdminSessionsTable />
      </div>
    </main>
  );
}
