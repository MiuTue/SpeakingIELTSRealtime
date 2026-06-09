import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { requireUserPage } from "@/lib/server/authGuards";

export default async function DashboardPage() {
  const { user } = await requireUserPage();
  return <UserDashboard name={user.name} />;
}
