import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/user";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/moderacion", label: "Moderación" },
  { href: "/admin/prode", label: "Prode" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/influencers", label: "Influencers" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center gap-2">
          <span className="rounded bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold">ADMIN</span>
          <nav className="flex gap-1">
            {ADMIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-surface hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}
