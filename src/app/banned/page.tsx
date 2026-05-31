"use client";

import { createClient } from "@/lib/supabase/client";

export default function BannedPage() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <span className="mb-4 block text-6xl">🚫</span>
        <h1 className="mb-2 text-2xl font-bold text-red-400">Cuenta suspendida</h1>
        <p className="mb-6 text-foreground/60">
          Tu cuenta ha sido suspendida por un administrador.
          Si creés que es un error, contactá al soporte.
        </p>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-surface-light px-6 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
