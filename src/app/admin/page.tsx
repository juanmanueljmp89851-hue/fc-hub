import { getAdminStats } from "@/lib/actions/admin";

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Usuarios", value: stats.users, color: "text-accent" },
    { label: "Torneos", value: stats.tournaments, color: "text-accent" },
    { label: "Partidos Casuales", value: stats.casualMatches, color: "text-accent" },
    { label: "Prodes", value: stats.prodes, color: "text-gold" },
    { label: "Jornadas Prode", value: stats.prodeWeeks, color: "text-gold" },
    { label: "Influencers", value: stats.influencers, color: "text-foreground" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Panel de Administración</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-surface-light bg-surface p-6"
          >
            <p className="text-sm text-foreground/50">{card.label}</p>
            <p className={`mt-1 text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
