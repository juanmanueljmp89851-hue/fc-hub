"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncUserWithDB } from "@/lib/actions/user";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { DmInbox } from "@/components/dm/DmInbox";
import type { User as DbUser } from "@/types";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/actualidad", label: "Actualidad" },
  { href: "/jugadores", label: "Cartas FC26" },
  { href: "/torneos", label: "Arena" },
  { href: "/jugar", label: "Duelos" },
  { href: "/ranking", label: "Clasificación" },
  { href: "/prode", label: "Prode" },
  { href: "/historial", label: "Historial" },
  { href: "/escena", label: "Competitivo" },
  { href: "/influencers", label: "Streamers" },
];

function UserMenu({ user }: { user: DbUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-surface-light px-3 py-1.5 transition-colors hover:border-accent"
      >
        <div className="relative h-7 w-7 overflow-hidden rounded-full bg-surface">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.username}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-foreground/40">
              👤
            </div>
          )}
        </div>
        <div className="flex flex-col items-start">
          <span className="max-w-[100px] truncate text-sm font-medium text-foreground/80">
            {user.username}
          </span>
          <span className="text-[10px] font-bold text-accent">{user.rankingPoints?.toLocaleString() ?? 0} pts</span>
        </div>
        <svg
          className={`h-4 w-4 text-foreground/40 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-surface-light bg-surface py-1 shadow-xl">
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-foreground/70 hover:bg-surface-light hover:text-accent"
          >
            Mi perfil
          </Link>
          <Link
            href="/perfil/editar"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-foreground/70 hover:bg-surface-light hover:text-accent"
          >
            Editar perfil
          </Link>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm font-medium text-gold hover:bg-surface-light"
            >
              Panel Admin
            </Link>
          )}
          <div className="my-1 h-px bg-surface-light" />
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-surface-light"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<DbUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const dbUser = await syncUserWithDB();
          if (dbUser?.banned) {
            window.location.href = "/banned";
            return;
          }
          setUser(dbUser);
        }
      } catch {
        // No auth
      }
      setAuthChecked(true);
    }
    checkAuth();
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-surface-light bg-background/80 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Modo Fosa" width={36} height={36} className="h-9 w-9" />
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black tracking-tight text-accent">MODO</span>
              <span className="text-lg font-black tracking-tight text-foreground">FOSA</span>
            </div>
            <span className="text-[9px] font-medium uppercase tracking-widest text-foreground/40">desde argentina</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {!authChecked ? (
            <div className="h-9 w-32 animate-pulse rounded-lg bg-surface" />
          ) : user ? (
            <>
              <DmInbox />
              <NotificationBell />
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg border border-surface-light px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-accent hover:text-accent"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Mobile: notification bell + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          {authChecked && user && <DmInbox />}
          {authChecked && user && <NotificationBell />}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col gap-1.5"
            aria-label="Menú"
          >
          <span
            className={`h-0.5 w-6 bg-foreground transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-foreground transition-opacity ${mobileOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-foreground transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-[slideDown_200ms_ease-out] border-t border-surface-light bg-background px-4 pb-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-medium text-foreground/70 transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex items-center justify-between border-t border-surface-light pt-3">
            <span className="text-xs text-foreground/40">Tema</span>
            <ThemeToggle />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {user ? (
              <>
                {/* User info block (mobile) */}
                <Link
                  href="/perfil"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg border border-surface-light px-4 py-3"
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-surface">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt={user.username} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg text-foreground/40">👤</div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground/90">{user.username}</span>
                    <span className="text-xs font-bold text-accent">{user.rankingPoints?.toLocaleString() ?? 0} pts</span>
                  </div>
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-center text-sm font-medium text-gold"
                  >
                    Panel Admin
                  </Link>
                )}
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                  className="rounded-lg bg-red-500/10 px-4 py-2 text-center text-sm font-medium text-red-400"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-lg border border-surface-light px-4 py-2 text-center text-sm font-medium text-foreground/70"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-accent px-4 py-2 text-center text-sm font-bold text-background"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
