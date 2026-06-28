import { getProdeWeeksAdmin, getAllProdesAdmin } from "@/lib/actions/admin";
import { ProdeWeekManager } from "@/components/admin/ProdeWeekManager";
import { AdminProdeList } from "@/components/admin/AdminProdeList";
import { ProdeTools } from "@/components/admin/ProdeTools";

export default async function AdminProdePage() {
  const [weeks, prodes] = await Promise.all([
    getProdeWeeksAdmin(),
    getAllProdesAdmin(),
  ]);

  const serializedWeeks = weeks.map((w) => ({
    ...w,
    deadline: w.deadline.toISOString(),
    createdAt: w.createdAt.toISOString(),
    matches: w.matches.map((m) => ({
      ...m,
      matchDate: m.matchDate.toISOString(),
    })),
  }));

  const serializedProdes = prodes.map((p) => ({
    id: p.id,
    name: p.name,
    visibility: p.visibility,
    status: p.status,
    createdBy: p.createdBy.username,
    participants: p._count.participants,
    joinRequests: p._count.joinRequests,
    createdAt: p.createdAt.toISOString(),
    deletedAt: p.deletedAt?.toISOString() ?? null,
    shareCode: p.shareCode,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Gestión Prode</h1>

      {/* Prodes list */}
      <AdminProdeList prodes={serializedProdes} />

      {/* Bracket & Group tools */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Herramientas</h2>
        <ProdeTools />
      </div>

      {/* Week manager */}
      <div className="mt-8">
        <ProdeWeekManager weeks={serializedWeeks} />
      </div>
    </div>
  );
}
