"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  return (
    <button
      className="rounded-md border border-[var(--line)] px-3 py-2 hover:bg-slate-100"
      onClick={() => void signOut({ fetchOptions: { onSuccess: () => window.location.assign("/") } })}
      aria-label="Sign out"
    >
      <LogOut size={16} />
    </button>
  );
}
