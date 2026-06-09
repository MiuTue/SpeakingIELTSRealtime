import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { requireAdminPage } from "@/lib/server/authGuards";

export default async function AdminUsersPage() {
  await requireAdminPage();
  return (
    <main className="lab-shell py-10">
      <p className="text-sm font-semibold uppercase text-[var(--magenta)]">Admin</p>
      <h1 className="mt-3 text-4xl font-semibold text-[var(--navy)]">Users</h1>
      <div className="mt-6">
        <AdminUsersTable />
      </div>
    </main>
  );
}
