import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Actualizá los equipos pendientes acá cuando se definan.
// Formato: { oldHome, oldAway, newHome, newAway }
// Solo se actualizan los que tienen "Por definir" en el nombre.

const UPDATES: { oldHome: string; oldAway: string; newHome?: string; newAway?: string }[] = [
  // Martes 30 — México vs 3° (Escocia/Ecuador)
  // { oldHome: "México", oldAway: "Por definir (3°C/E)", newAway: "Ecuador" },

  // Miércoles 1 — 1°L vs 3°
  // { oldHome: "Por definir (1°L)", oldAway: "Por definir (3°)", newHome: "Inglaterra", newAway: "Senegal" },

  // Miércoles 1 — Bélgica vs 3°
  // { oldHome: "Bélgica", oldAway: "Por definir (3°)", newAway: "Corea del Sur" },

  // Jueves 2 — España vs 2°J
  // { oldHome: "España", oldAway: "Por definir (2°J)", newAway: "Austria" },

  // Jueves 2 — 2°K vs 2°L
  // { oldHome: "Por definir (2°K)", oldAway: "Por definir (2°L)", newHome: "Portugal", newAway: "Ghana" },

  // Viernes 3 — Suiza vs 3°
  // { oldHome: "Suiza", oldAway: "Por definir (3°)", newAway: "Irán" },

  // Viernes 3 — 1°K vs 3°
  // { oldHome: "Por definir (1°K)", oldAway: "Por definir (3°)", newHome: "Colombia", newAway: "Croacia" },
];

async function main() {
  if (UPDATES.length === 0) {
    console.log("⚠️  No hay actualizaciones configuradas.");
    console.log("   Descomentá las líneas en UPDATES con los equipos correctos y volvé a correr.");
    return;
  }

  console.log("Actualizando equipos pendientes en 16avos...\n");

  const week = await prisma.prodeWeek.findFirst({
    where: { title: "16avos de Final" },
    include: { matches: true },
  });

  if (!week) {
    console.log("❌ No se encontró la semana '16avos de Final'. Corré seed-16avos.ts primero.");
    return;
  }

  for (const update of UPDATES) {
    const match = week.matches.find(
      (m) => m.homeTeam === update.oldHome && m.awayTeam === update.oldAway
    );

    if (!match) {
      console.log(`  ❌ No encontrado: ${update.oldHome} vs ${update.oldAway}`);
      continue;
    }

    await prisma.prodeMatch.update({
      where: { id: match.id },
      data: {
        ...(update.newHome && { homeTeam: update.newHome }),
        ...(update.newAway && { awayTeam: update.newAway }),
      },
    });

    const home = update.newHome || update.oldHome;
    const away = update.newAway || update.oldAway;
    console.log(`  ✅ ${update.oldHome} vs ${update.oldAway} → ${home} vs ${away}`);
  }

  // Mostrar estado actual
  const updated = await prisma.prodeMatch.findMany({
    where: { weekId: week.id },
    orderBy: { matchDate: "asc" },
  });

  console.log(`\n📋 Estado actual:\n`);
  for (const m of updated) {
    const pending = m.homeTeam.includes("Por definir") || m.awayTeam.includes("Por definir");
    const icon = pending ? "⏳" : "✅";
    const date = m.matchDate.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
    console.log(`  ${icon} ${m.homeTeam} vs ${m.awayTeam} — ${date}`);
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
