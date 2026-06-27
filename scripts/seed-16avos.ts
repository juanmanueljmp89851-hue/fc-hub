import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// FIFA World Cup 2026 — 16avos de Final (Round of 32)
// 16 partidos, del 28 Jun al 3 Jul
// Horarios en Argentina (UTC-3)

const MATCHES_16AVOS = {
  "16avos de Final": {
    deadline: "2026-06-28T15:00:00-03:00", // 1h antes del primer partido
    matches: [
      // Domingo 28 de junio
      { home: "Sudáfrica", away: "Canadá", date: "2026-06-28T16:00:00-03:00", stage: "16avos de Final" },

      // Lunes 29 de junio
      { home: "Brasil", away: "Japón", date: "2026-06-29T14:00:00-03:00", stage: "16avos de Final" },
      { home: "Alemania", away: "Paraguay", date: "2026-06-29T17:30:00-03:00", stage: "16avos de Final" },
      { home: "Países Bajos", away: "Marruecos", date: "2026-06-29T22:00:00-03:00", stage: "16avos de Final" },

      // Martes 30 de junio
      { home: "Costa de Marfil", away: "Noruega", date: "2026-06-30T14:00:00-03:00", stage: "16avos de Final" },
      { home: "Francia", away: "Suecia", date: "2026-06-30T18:00:00-03:00", stage: "16avos de Final" },
      { home: "México", away: "Por definir (3°C/E)", date: "2026-06-30T22:00:00-03:00", stage: "16avos de Final" },

      // Miércoles 1 de julio
      { home: "Por definir (1°L)", away: "Por definir (3°)", date: "2026-07-01T13:00:00-03:00", stage: "16avos de Final" },
      { home: "Bélgica", away: "Por definir (3°)", date: "2026-07-01T17:00:00-03:00", stage: "16avos de Final" },
      { home: "Estados Unidos", away: "Bosnia y Herzegovina", date: "2026-07-01T21:00:00-03:00", stage: "16avos de Final" },

      // Jueves 2 de julio
      { home: "España", away: "Por definir (2°J)", date: "2026-07-02T16:00:00-03:00", stage: "16avos de Final" },
      { home: "Por definir (2°K)", away: "Por definir (2°L)", date: "2026-07-02T20:00:00-03:00", stage: "16avos de Final" },

      // Viernes 3 de julio
      { home: "Suiza", away: "Por definir (3°)", date: "2026-07-03T00:00:00-03:00", stage: "16avos de Final" },
      { home: "Australia", away: "Egipto", date: "2026-07-03T15:00:00-03:00", stage: "16avos de Final" },
      { home: "Argentina", away: "Cabo Verde", date: "2026-07-03T19:00:00-03:00", stage: "16avos de Final" },
      { home: "Por definir (1°K)", away: "Por definir (3°)", date: "2026-07-03T22:30:00-03:00", stage: "16avos de Final" },
    ],
  },
};

async function main() {
  console.log("Seeding 16avos de Final — Mundial 2026...\n");

  for (const [title, data] of Object.entries(MATCHES_16AVOS)) {
    const existingWeek = await prisma.prodeWeek.findFirst({
      where: { title },
    });

    if (existingWeek) {
      console.log(`  ⏭ "${title}" ya existe (id: ${existingWeek.id})`);
      console.log(`  Para actualizar equipos pendientes, usá: npx tsx scripts/update-16avos.ts`);
      continue;
    }

    const week = await prisma.prodeWeek.create({
      data: {
        title,
        deadline: new Date(data.deadline),
        status: "UPCOMING",
      },
    });

    await prisma.prodeMatch.createMany({
      data: data.matches.map((m) => ({
        weekId: week.id,
        homeTeam: m.home,
        awayTeam: m.away,
        matchDate: new Date(m.date),
        stage: m.stage,
      })),
    });

    console.log(`  ✅ "${title}" creada con ${data.matches.length} partidos`);
    console.log(`  Week ID: ${week.id}`);
  }

  // Mostrar resumen
  const week = await prisma.prodeWeek.findFirst({
    where: { title: "16avos de Final" },
    include: { matches: { orderBy: { matchDate: "asc" } } },
  });

  if (week) {
    console.log(`\n📋 Partidos cargados:\n`);
    for (const m of week.matches) {
      const pending = m.homeTeam.includes("Por definir") || m.awayTeam.includes("Por definir");
      const icon = pending ? "⏳" : "✅";
      const date = m.matchDate.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
      console.log(`  ${icon} ${m.homeTeam} vs ${m.awayTeam} — ${date}`);
    }

    const confirmed = week.matches.filter(
      (m) => !m.homeTeam.includes("Por definir") && !m.awayTeam.includes("Por definir")
    ).length;
    const pending = week.matches.length - confirmed;
    console.log(`\n  Total: ${week.matches.length} | Confirmados: ${confirmed} | Pendientes: ${pending}`);
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
