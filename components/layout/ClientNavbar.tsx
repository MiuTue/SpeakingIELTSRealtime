"use client";

import dynamic from "next/dynamic";

export const ClientNavbar = dynamic(
  () => import("@/components/layout/Navbar").then((mod) => mod.Navbar),
  {
    ssr: false,
    loading: () => (
      <header className="border-b border-[var(--line)] bg-[#fbfaf7]/85 h-16 w-full">
        <div className="lab-shell flex h-full items-center justify-between">
          <div className="h-6 w-32 bg-slate-100 animate-pulse rounded-md" />
          <div className="h-6 w-64 bg-slate-100 animate-pulse rounded-md" />
        </div>
      </header>
    )
  }
);
