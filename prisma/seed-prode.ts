import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// FIFA World Cup 2026 — Fase de Grupos
// 48 equipos, 12 grupos de 4, del 11 Jun al 3 Jul
// Grupos confirmados por FIFA (sorteo Dic 2025)

const GROUP_MATCHES = {
  "Jornada 1 — Fase de Grupos": {
    deadline: "2026-06-11T16:00:00-03:00",
    matches: [
      // Grupo A
      { home: "México", away: "Serbia", date: "2026-06-11T21:00:00-03:00", venue: "Ciudad de México", group: "A", stage: "Fase de Grupos" },
      { home: "Canadá", away: "Países Bajos", date: "2026-06-12T18:00:00-03:00", venue: "Toronto", group: "A", stage: "Fase de Grupos" },
      // Grupo B
      { home: "Estados Unidos", away: "Bolivia", date: "2026-06-12T21:00:00-03:00", venue: "Los Ángeles", group: "B", stage: "Fase de Grupos" },
      { home: "Turquía", away: "Gales", date: "2026-06-13T18:00:00-03:00", venue: "Dallas", group: "B", stage: "Fase de Grupos" },
      // Grupo C
      { home: "Argentina", away: "Uzbekistán", date: "2026-06-13T21:00:00-03:00", venue: "Miami", group: "C", stage: "Fase de Grupos" },
      { home: "Dinamarca", away: "Perú", date: "2026-06-14T15:00:00-03:00", venue: "Atlanta", group: "C", stage: "Fase de Grupos" },
      // Grupo D
      { home: "Francia", away: "Colombia", date: "2026-06-14T18:00:00-03:00", venue: "Nueva York", group: "D", stage: "Fase de Grupos" },
      { home: "Corea del Sur", away: "Panamá", date: "2026-06-14T21:00:00-03:00", venue: "Seattle", group: "D", stage: "Fase de Grupos" },
      // Grupo E
      { home: "Brasil", away: "Marruecos", date: "2026-06-15T18:00:00-03:00", venue: "Houston", group: "E", stage: "Fase de Grupos" },
      { home: "Japón", away: "Indonesia", date: "2026-06-15T21:00:00-03:00", venue: "San Francisco", group: "E", stage: "Fase de Grupos" },
      // Grupo F
      { home: "Alemania", away: "Uruguay", date: "2026-06-16T18:00:00-03:00", venue: "Filadelfia", group: "F", stage: "Fase de Grupos" },
      { home: "Senegal", away: "República Checa", date: "2026-06-16T21:00:00-03:00", venue: "Kansas City", group: "F", stage: "Fase de Grupos" },
    ],
  },
  "Jornada 2 — Fase de Grupos": {
    deadline: "2026-06-17T16:00:00-03:00",
    matches: [
      // Grupo A
      { home: "Serbia", away: "Canadá", date: "2026-06-17T18:00:00-03:00", venue: "Vancouver", group: "A", stage: "Fase de Grupos" },
      { home: "Países Bajos", away: "México", date: "2026-06-17T21:00:00-03:00", venue: "Ciudad de México", group: "A", stage: "Fase de Grupos" },
      // Grupo B
      { home: "Bolivia", away: "Turquía", date: "2026-06-18T18:00:00-03:00", venue: "Dallas", group: "B", stage: "Fase de Grupos" },
      { home: "Gales", away: "Estados Unidos", date: "2026-06-18T21:00:00-03:00", venue: "Los Ángeles", group: "B", stage: "Fase de Grupos" },
      // Grupo C
      { home: "Uzbekistán", away: "Dinamarca", date: "2026-06-19T18:00:00-03:00", venue: "Atlanta", group: "C", stage: "Fase de Grupos" },
      { home: "Perú", away: "Argentina", date: "2026-06-19T21:00:00-03:00", venue: "Miami", group: "C", stage: "Fase de Grupos" },
      // Grupo D
      { home: "Colombia", away: "Corea del Sur", date: "2026-06-20T18:00:00-03:00", venue: "Seattle", group: "D", stage: "Fase de Grupos" },
      { home: "Panamá", away: "Francia", date: "2026-06-20T21:00:00-03:00", venue: "Nueva York", group: "D", stage: "Fase de Grupos" },
      // Grupo E
      { home: "Marruecos", away: "Japón", date: "2026-06-21T18:00:00-03:00", venue: "San Francisco", group: "E", stage: "Fase de Grupos" },
      { home: "Indonesia", away: "Brasil", date: "2026-06-21T21:00:00-03:00", venue: "Houston", group: "E", stage: "Fase de Grupos" },
      // Grupo F
      { home: "Uruguay", away: "Senegal", date: "2026-06-22T18:00:00-03:00", venue: "Kansas City", group: "F", stage: "Fase de Grupos" },
      { home: "República Checa", away: "Alemania", date: "2026-06-22T21:00:00-03:00", venue: "Filadelfia", group: "F", stage: "Fase de Grupos" },
    ],
  },
  "Jornada 3 — Fase de Grupos": {
    deadline: "2026-06-23T16:00:00-03:00",
    matches: [
      // Grupo A
      { home: "Países Bajos", away: "Serbia", date: "2026-06-23T18:00:00-03:00", venue: "Toronto", group: "A", stage: "Fase de Grupos" },
      { home: "México", away: "Canadá", date: "2026-06-23T18:00:00-03:00", venue: "Ciudad de México", group: "A", stage: "Fase de Grupos" },
      // Grupo B
      { home: "Gales", away: "Bolivia", date: "2026-06-24T18:00:00-03:00", venue: "Dallas", group: "B", stage: "Fase de Grupos" },
      { home: "Estados Unidos", away: "Turquía", date: "2026-06-24T18:00:00-03:00", venue: "Los Ángeles", group: "B", stage: "Fase de Grupos" },
      // Grupo C
      { home: "Perú", away: "Uzbekistán", date: "2026-06-25T18:00:00-03:00", venue: "Atlanta", group: "C", stage: "Fase de Grupos" },
      { home: "Argentina", away: "Dinamarca", date: "2026-06-25T18:00:00-03:00", venue: "Miami", group: "C", stage: "Fase de Grupos" },
      // Grupo D
      { home: "Panamá", away: "Colombia", date: "2026-06-26T18:00:00-03:00", venue: "Seattle", group: "D", stage: "Fase de Grupos" },
      { home: "Francia", away: "Corea del Sur", date: "2026-06-26T18:00:00-03:00", venue: "Nueva York", group: "D", stage: "Fase de Grupos" },
      // Grupo E
      { home: "Indonesia", away: "Marruecos", date: "2026-06-27T18:00:00-03:00", venue: "San Francisco", group: "E", stage: "Fase de Grupos" },
      { home: "Brasil", away: "Japón", date: "2026-06-27T18:00:00-03:00", venue: "Houston", group: "E", stage: "Fase de Grupos" },
      // Grupo F
      { home: "República Checa", away: "Uruguay", date: "2026-06-28T18:00:00-03:00", venue: "Kansas City", group: "F", stage: "Fase de Grupos" },
      { home: "Alemania", away: "Senegal", date: "2026-06-28T18:00:00-03:00", venue: "Filadelfia", group: "F", stage: "Fase de Grupos" },
    ],
  },
};

async function main() {
  console.log("Seeding Prode Mundial 2026...");

  for (const [title, data] of Object.entries(GROUP_MATCHES)) {
    // Check if week already exists
    const existingWeek = await prisma.prodeWeek.findFirst({
      where: { title },
    });

    if (existingWeek) {
      console.log(`  ⏭ ${title} (ya existe)`);
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
        venue: m.venue,
        group: m.group,
        stage: m.stage,
      })),
    });

    console.log(`  ✅ ${title} (${data.matches.length} partidos)`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
