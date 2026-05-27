"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toggleUserRole } from "@/lib/actions/admin";

interface User {
  id: string;
  username: string | null;
  email: string;
  role: string;
  avatarUrl: string | null;
  rankingPoints: number;
  createdAt: string;
}

export function UserManager({ users, search }: { users: User[]; search?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(search ?? "");
  const [loading, setLoading] = useState("");

  function handleSearch() {
    if (query) {
      router.push(`${pathname}?q=${encodeURIComponent(query)}`);
    } else {
      router.push(pathname);
    }
  }

  async function handleToggleRole(userId: string) {
    setLoading(userId);
    await toggleUserRole(userId);
    router.refresh();
    setLoading("");
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Buscar por username o email..."
          className="flex-1 rounded-lg border border-surface-light bg-background px-4 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
        />
        <button
          onClick={handleSearch}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background"
        >
          Buscar
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-light">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-light bg-surface">
              <th className="px-4 py-3 text-left font-medium text-foreground/50">Usuario</th>
              <th className="px-4 py-3 text-left font-medium text-foreground/50">Email</th>
              <th className="px-4 py-3 text-center font-medium text-foreground/50">Ranking</th>
              <th className="px-4 py-3 text-center font-medium text-foreground/50">Rol</th>
              <th className="px-4 py-3 text-center font-medium text-foreground/50">Registro</th>
              <th className="px-4 py-3 text-center font-medium text-foreground/50">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-surface-light/50 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                        {(user.username ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{user.username ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground/60">{user.email}</td>
                <td className="px-4 py-3 text-center font-bold text-accent">{user.rankingPoints}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    user.role === "ADMIN" ? "bg-gold/20 text-gold" : "bg-foreground/10 text-foreground/50"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-foreground/40">
                  {new Date(user.createdAt).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggleRole(user.id)}
                    disabled={loading === user.id}
                    className="rounded bg-surface-light px-2 py-1 text-xs text-foreground/60 hover:text-accent"
                  >
                    {loading === user.id ? "..." : user.role === "ADMIN" ? "Quitar Admin" : "Hacer Admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-foreground/30">{users.length} usuarios</p>
    </div>
  );
}
