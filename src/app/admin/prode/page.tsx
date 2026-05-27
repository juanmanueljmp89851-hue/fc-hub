import { getProdeWeeksAdmin } from "@/lib/actions/admin";
import { ProdeWeekManager } from "@/components/admin/ProdeWeekManager";

export default async function AdminProdePage() {
  const weeks = await getProdeWeeksAdmin();

  const serialized = weeks.map((w) => ({
    ...w,
    deadline: w.deadline.toISOString(),
    createdAt: w.createdAt.toISOString(),
    matches: w.matches.map((m) => ({
      ...m,
      matchDate: m.matchDate.toISOString(),
    })),
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Gestión Prode</h1>
      <ProdeWeekManager weeks={serialized} />
    </div>
  );
}
