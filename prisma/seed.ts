import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding FC Hub...");

  // ─── USUARIOS DEMO ──────────────────────────────────────
  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: "ElPibe10" },
      update: {},
      create: { username: "ElPibe10", email: "elpibe10@demo.com", supabaseId: "demo-001", reputationPoints: 118, rankingPoints: 87 },
    }),
    prisma.user.upsert({
      where: { username: "GolDeVestuario" },
      update: {},
      create: { username: "GolDeVestuario", email: "goldev@demo.com", supabaseId: "demo-002", reputationPoints: 112, rankingPoints: 81 },
    }),
    prisma.user.upsert({
      where: { username: "TikiTaka_AR" },
      update: {},
      create: { username: "TikiTaka_AR", email: "tikitaka@demo.com", supabaseId: "demo-003", reputationPoints: 108, rankingPoints: 78 },
    }),
    prisma.user.upsert({
      where: { username: "CrackDelPad" },
      update: {},
      create: { username: "CrackDelPad", email: "crackpad@demo.com", supabaseId: "demo-004", reputationPoints: 105, rankingPoints: 72 },
    }),
    prisma.user.upsert({
      where: { username: "FutChampion" },
      update: {},
      create: { username: "FutChampion", email: "futchamp@demo.com", supabaseId: "demo-005", reputationPoints: 103, rankingPoints: 69 },
    }),
    prisma.user.upsert({
      where: { username: "Nostradamus_FC" },
      update: {},
      create: { username: "Nostradamus_FC", email: "nostra@demo.com", supabaseId: "demo-006", reputationPoints: 100, rankingPoints: 45 },
    }),
    prisma.user.upsert({
      where: { username: "ProdeKing" },
      update: {},
      create: { username: "ProdeKing", email: "prodeking@demo.com", supabaseId: "demo-007", reputationPoints: 100, rankingPoints: 30 },
    }),
    prisma.user.upsert({
      where: { username: "FCHub_Admin" },
      update: {},
      create: { username: "FCHub_Admin", email: "admin@fchub.com", supabaseId: "demo-admin", role: "ADMIN", reputationPoints: 100, rankingPoints: 0 },
    }),
  ]);

  console.log(`✅ ${users.length} usuarios creados`);

  // ─── PRODE — JORNADAS MUNDIAL 2026 ─────────────────────

  // Limpiar prode existente
  await prisma.prodePrediction.deleteMany();
  await prisma.prodeMatch.deleteMany();
  await prisma.prodeWeek.deleteMany();

  const jornada1 = await prisma.prodeWeek.create({
    data: {
      title: "Jornada 1 — Fase de Grupos (11–15 de junio)",
      deadline: new Date("2026-06-12T21:00:00-03:00"),
      status: "SCORED",
      matches: {
        create: [
          { homeTeam: "México", awayTeam: "TBD", matchDate: new Date("2026-06-12T21:00:00-03:00"), venue: "Ciudad de México", stage: "Grupo A", homeScore: 2, awayScore: 1, status: "FINISHED" },
          { homeTeam: "Canadá", awayTeam: "TBD", matchDate: new Date("2026-06-12T00:00:00-03:00"), venue: "Toronto", stage: "Grupo B", homeScore: 0, awayScore: 0, status: "FINISHED" },
          { homeTeam: "USA", awayTeam: "TBD", matchDate: new Date("2026-06-13T21:00:00-03:00"), venue: "Los Ángeles", stage: "Grupo C", homeScore: 3, awayScore: 1, status: "FINISHED" },
          { homeTeam: "Argentina", awayTeam: "TBD", matchDate: new Date("2026-06-13T21:00:00-03:00"), venue: "Miami", stage: "Grupo D", homeScore: 2, awayScore: 0, status: "FINISHED" },
          { homeTeam: "Brasil", awayTeam: "TBD", matchDate: new Date("2026-06-14T18:00:00-03:00"), venue: "Dallas", stage: "Grupo E", homeScore: 1, awayScore: 1, status: "FINISHED" },
          { homeTeam: "Francia", awayTeam: "TBD", matchDate: new Date("2026-06-14T21:00:00-03:00"), venue: "Nueva York", stage: "Grupo F", homeScore: 3, awayScore: 2, status: "FINISHED" },
          { homeTeam: "España", awayTeam: "TBD", matchDate: new Date("2026-06-15T18:00:00-03:00"), venue: "Kansas City", stage: "Grupo G", homeScore: 4, awayScore: 0, status: "FINISHED" },
          { homeTeam: "Inglaterra", awayTeam: "TBD", matchDate: new Date("2026-06-15T21:00:00-03:00"), venue: "Boston", stage: "Grupo H", homeScore: 2, awayScore: 1, status: "FINISHED" },
        ],
      },
    },
  });

  const jornada2 = await prisma.prodeWeek.create({
    data: {
      title: "Jornada 2 — Fase de Grupos (18–22 de junio)",
      deadline: new Date("2026-06-18T18:00:00-03:00"),
      status: "OPEN",
      matches: {
        create: [
          { homeTeam: "Alemania", awayTeam: "TBD", matchDate: new Date("2026-06-18T21:00:00-03:00"), venue: "Houston", stage: "Grupo F" },
          { homeTeam: "Portugal", awayTeam: "TBD", matchDate: new Date("2026-06-19T21:00:00-03:00"), venue: "Filadelfia", stage: "Grupo E" },
          { homeTeam: "Argentina", awayTeam: "TBD", matchDate: new Date("2026-06-20T21:00:00-03:00"), venue: "Miami", stage: "Grupo D" },
          { homeTeam: "Brasil", awayTeam: "TBD", matchDate: new Date("2026-06-21T21:00:00-03:00"), venue: "Dallas", stage: "Grupo E" },
          { homeTeam: "España", awayTeam: "TBD", matchDate: new Date("2026-06-22T21:00:00-03:00"), venue: "Kansas City", stage: "Grupo G" },
        ],
      },
    },
  });

  const jornada3 = await prisma.prodeWeek.create({
    data: {
      title: "Jornada 3 — Fase de Grupos (25–27 de junio)",
      deadline: new Date("2026-06-25T18:00:00-03:00"),
      status: "UPCOMING",
      matches: {
        create: [
          { homeTeam: "Argentina", awayTeam: "TBD", matchDate: new Date("2026-06-25T21:00:00-03:00"), venue: "Miami", stage: "Grupo D" },
          { homeTeam: "Brasil", awayTeam: "TBD", matchDate: new Date("2026-06-26T21:00:00-03:00"), venue: "Dallas", stage: "Grupo E" },
          { homeTeam: "Francia", awayTeam: "TBD", matchDate: new Date("2026-06-27T21:00:00-03:00"), venue: "Nueva York", stage: "Grupo F" },
        ],
      },
    },
  });

  const jornada4 = await prisma.prodeWeek.create({
    data: {
      title: "Jornada 4 — Octavos de Final (1–4 de julio)",
      deadline: new Date("2026-07-01T18:00:00-03:00"),
      status: "UPCOMING",
      matches: {
        create: [
          { homeTeam: "1ro Grupo A", awayTeam: "2do Grupo B", matchDate: new Date("2026-07-01T21:00:00-03:00"), venue: "TBD", stage: "Octavos" },
          { homeTeam: "1ro Grupo C", awayTeam: "2do Grupo D", matchDate: new Date("2026-07-02T21:00:00-03:00"), venue: "TBD", stage: "Octavos" },
          { homeTeam: "1ro Grupo E", awayTeam: "2do Grupo F", matchDate: new Date("2026-07-03T21:00:00-03:00"), venue: "TBD", stage: "Octavos" },
          { homeTeam: "1ro Grupo G", awayTeam: "2do Grupo H", matchDate: new Date("2026-07-04T21:00:00-03:00"), venue: "TBD", stage: "Octavos" },
        ],
      },
    },
  });

  const jornada5 = await prisma.prodeWeek.create({
    data: {
      title: "Jornada 5 — Cuartos de Final (11–12 de julio)",
      deadline: new Date("2026-07-11T18:00:00-03:00"),
      status: "UPCOMING",
      matches: {
        create: [
          { homeTeam: "TBD", awayTeam: "TBD", matchDate: new Date("2026-07-11T21:00:00-03:00"), venue: "TBD", stage: "Cuartos" },
          { homeTeam: "TBD", awayTeam: "TBD", matchDate: new Date("2026-07-12T21:00:00-03:00"), venue: "TBD", stage: "Cuartos" },
        ],
      },
    },
  });

  const jornada6 = await prisma.prodeWeek.create({
    data: {
      title: "Jornada 6 — Semifinales (15–16 de julio)",
      deadline: new Date("2026-07-15T18:00:00-03:00"),
      status: "UPCOMING",
      matches: {
        create: [
          { homeTeam: "TBD", awayTeam: "TBD", matchDate: new Date("2026-07-15T21:00:00-03:00"), venue: "TBD", stage: "Semifinal" },
          { homeTeam: "TBD", awayTeam: "TBD", matchDate: new Date("2026-07-16T21:00:00-03:00"), venue: "TBD", stage: "Semifinal" },
        ],
      },
    },
  });

  const jornada7 = await prisma.prodeWeek.create({
    data: {
      title: "Jornada 7 — FINAL (19 de julio)",
      deadline: new Date("2026-07-19T18:00:00-03:00"),
      status: "UPCOMING",
      matches: {
        create: [
          { homeTeam: "TBD", awayTeam: "TBD", matchDate: new Date("2026-07-19T21:00:00-03:00"), venue: "MetLife Stadium, Nueva York", stage: "Final" },
        ],
      },
    },
  });

  console.log("✅ 7 jornadas del Prode creadas");

  // ─── INFLUENCERS ────────────────────────────────────────
  await prisma.influencerVideo.deleteMany();
  await prisma.influencer.deleteMany();
  const influencers = await Promise.all([
    prisma.influencer.create({ data: { name: "DjMaRiiO", slug: "djmariio", youtubeChannelId: "UCJ5ZBNeQ5EL_GbLqpHwBEkw" } }),
    prisma.influencer.create({ data: { name: "Gravesen", slug: "gravesen", youtubeChannelId: "UC4q0KGGOxRFmLOHXJeJVLiw" } }),
    prisma.influencer.create({ data: { name: "Obrun", slug: "obrun", youtubeChannelId: "UCJ_placeholder_obrun" } }),
    prisma.influencer.create({ data: { name: "NeiraGaming", slug: "neiragaming", youtubeChannelId: "UCJ_placeholder_neira" } }),
    prisma.influencer.create({ data: { name: "Spursito", slug: "spursito", youtubeChannelId: "UCJ_placeholder_spursito" } }),
  ]);

  console.log(`✅ ${influencers.length} influencers creados`);

  console.log("🏆 Seed completado!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
