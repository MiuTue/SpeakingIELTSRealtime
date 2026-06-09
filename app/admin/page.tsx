import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { requireAdminPage } from "@/lib/server/authGuards";

export default async function AdminPage() {
  await requireAdminPage();
  return <AdminDashboard />;
}
