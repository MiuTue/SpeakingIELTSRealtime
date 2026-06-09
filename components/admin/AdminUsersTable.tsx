"use client";

import { useEffect, useMemo, useState } from "react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  targetBand: number;
  createdAt: string;
  _count: { sessions: number };
};

export function AdminUsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((response) => response.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setUsers([]));
  }, []);

  const filtered = useMemo(
    () => users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())),
    [users, query]
  );

  return (
    <section className="soft-card p-5">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search users"
        className="focus-ring mb-4 w-full rounded-md border border-[var(--line)] px-3 py-3 text-sm"
      />
      <div className="overflow-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-3">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Target</th>
              <th>Sessions</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-[var(--line)]">
                <td className="py-3 font-semibold text-[var(--navy)]">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.targetBand}</td>
                <td>{user._count.sessions}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
