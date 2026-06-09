import { SettingsForm } from "@/components/settings/SettingsForm";
import { requireUserPage } from "@/lib/server/authGuards";

export default async function SettingsPage() {
  const { user } = await requireUserPage();
  return (
    <main className="lab-shell py-10">
      <p className="text-sm font-semibold uppercase text-[var(--magenta)]">Settings</p>
      <h1 className="mt-3 text-4xl font-semibold text-[var(--navy)]">Profile and target band</h1>
      <div className="mt-6">
        <SettingsForm name={user.name} email={user.email} targetBand={user.targetBand ?? 7} />
      </div>
    </main>
  );
}
