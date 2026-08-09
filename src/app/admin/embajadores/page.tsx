import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/user";
import { getAmbassadorDashboard } from "@/lib/actions/ambassador";
import { AdminAmbassadorPanel } from "@/components/ambassador/AdminAmbassadorPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Embajadores | Modo Fosa",
};

export default async function AdminEmbajadoresPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const dashboard = await getAmbassadorDashboard();
  if (!dashboard) redirect("/");

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-2 inline-flex items-center gap-1 text-xs text-foreground/40 hover:text-accent"
            >
              ← Admin
            </Link>
            <h1 className="text-2xl font-bold">🔥 Embajadores</h1>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-surface-light bg-background p-4 text-center">
            <p className="text-2xl font-black text-accent">{dashboard.totalAmbassadors}</p>
            <p className="text-xs text-foreground/50">Embajadores</p>
          </div>
          <div className="rounded-xl border border-surface-light bg-background p-4 text-center">
            <p className="text-2xl font-black text-foreground/70">{dashboard.totalReferrals}</p>
            <p className="text-xs text-foreground/50">Referidos totales</p>
          </div>
          <div className="rounded-xl border border-surface-light bg-background p-4 text-center">
            <p className="text-2xl font-black text-accent">{dashboard.activeReferrals}</p>
            <p className="text-xs text-foreground/50">Referidos activos</p>
          </div>
          <div className="rounded-xl border border-surface-light bg-background p-4 text-center">
            <p className="text-2xl font-black text-gold">{dashboard.totalBengalas}</p>
            <p className="text-xs text-foreground/50">Bengalas emitidas</p>
          </div>
        </div>

        <AdminAmbassadorPanel dashboard={dashboard} />
      </main>
    </div>
  );
}
