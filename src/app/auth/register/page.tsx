"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (username.length < 3) {
      setError("El username debe tener al menos 3 caracteres");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setError("Supabase no configurado. Copiá .env.example a .env.local y completá las credenciales.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleRegister() {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setError("Supabase no configurado. Copiá .env.example a .env.local y completá las credenciales.");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  if (success) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto flex max-w-md items-center justify-center px-4 py-16">
          <Card className="w-full text-center">
            <span className="mb-4 block text-5xl">📧</span>
            <h2 className="mb-2 text-xl font-bold">Revisá tu email</h2>
            <p className="mb-4 text-sm text-foreground/60">
              Te enviamos un link de confirmación a <strong>{email}</strong>.
              Hacé click en el link para activar tu cuenta.
            </p>
            <Link
              href="/auth/login"
              className="inline-block text-sm text-accent hover:underline"
            >
              Ir a iniciar sesión
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto flex max-w-md items-center justify-center px-4 py-16">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
          </CardHeader>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/70">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: ElPibe10"
                className="w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-xs text-foreground/40">
                Este nombre se muestra en torneos, ranking y perfil público
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/70">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/70">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-surface-light bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-surface-light" />
            <span className="text-xs text-foreground/40">o</span>
            <div className="h-px flex-1 bg-surface-light" />
          </div>

          <button
            onClick={handleGoogleRegister}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-surface-light py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-accent hover:text-accent"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Registrarse con Google
          </button>

          <p className="mt-4 text-center text-sm text-foreground/50">
            ¿Ya tenés cuenta?{" "}
            <Link href="/auth/login" className="text-accent hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
