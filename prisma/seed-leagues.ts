import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding external leagues...");

  const leagues = [
    {
      name: "IESA Argentina",
      slug: "iesa-argentina",
      description:
        "Liga más grande del mundo de Clubes Pro en EA FC. Varias divisiones con sistema de ascensos y descensos. NextGen y OldGen.",
      websiteUrl: "https://iesa-global.com/pro/federacion.php?sec=fed&fed=2",
      instagramUrl: "https://www.instagram.com/iesafifaar/",
      platform: ["PS5", "XBOX", "PC"] as const,
      gameMode: "CLUBS_PRO" as const,
      country: "Argentina",
      fetchSource: "SCRAPER_IESA" as const,
      fetchUrl: "https://iesa-global.com/pro/federacion.php?sec=fed&fed=2",
    },
    {
      name: "eLPF (eLiga Profesional)",
      slug: "elpf",
      description:
        "Competencia oficial de EA FC organizada por la Liga Profesional de Fútbol de AFA. 30 clubes de Primera División representados. Ultimate Team competitivo en PS5.",
      websiteUrl: "https://elpf.ar/",
      instagramUrl: null,
      platform: ["PS5"] as const,
      gameMode: "ULTIMATE_TEAM" as const,
      country: "Argentina",
      fetchSource: "SCRAPER_ELPF" as const,
      fetchUrl: "https://elpf.ar/",
    },
    {
      name: "VPG Latinoamérica",
      slug: "vpg-latam",
      description:
        "Virtual Pro Gaming — plataforma global de 11v11 Clubes Pro con 500K+ usuarios. División Latinoamérica con ligas por zona horaria.",
      websiteUrl: "https://virtualprogaming.com/",
      instagramUrl: "https://www.instagram.com/vpgesports/",
      discordUrl: null,
      platform: ["PS5", "XBOX", "PC"] as const,
      gameMode: "CLUBS_PRO" as const,
      country: "Latinoamérica",
      fetchSource: "API_VPG" as const,
      fetchUrl: null,
    },
    {
      name: "Liga Argentina de Clubes Pro",
      slug: "licp-argentina",
      description:
        "Comunidad argentina independiente de Clubes Pro. Torneos regulares organizados por la comunidad.",
      websiteUrl: null,
      instagramUrl: "https://www.instagram.com/licpargentina/",
      platform: ["PS5", "XBOX"] as const,
      gameMode: "CLUBS_PRO" as const,
      country: "Argentina",
      fetchSource: "MANUAL" as const,
      fetchUrl: null,
    },
    {
      name: "FC Pro Leagues",
      slug: "fc-pro-leagues",
      description:
        "Circuito oficial de EA Sports. Clasificatorias nacionales que alimentan al FC Pro World Championship. Prize pool combinado de más de $1M USD.",
      websiteUrl: "https://www.ea.com/games/ea-sports-fc/fc-pro/fc-pro-leagues",
      instagramUrl: null,
      platform: ["PS5"] as const,
      gameMode: "ULTIMATE_TEAM" as const,
      country: "Global",
      fetchSource: "MANUAL" as const,
      fetchUrl: null,
    },
  ];

  for (const league of leagues) {
    await prisma.externalLeague.upsert({
      where: { slug: league.slug },
      update: {
        name: league.name,
        description: league.description,
        websiteUrl: league.websiteUrl,
        instagramUrl: league.instagramUrl,
        platform: [...league.platform],
        gameMode: league.gameMode,
        country: league.country,
        fetchSource: league.fetchSource,
        fetchUrl: league.fetchUrl,
      },
      create: {
        name: league.name,
        slug: league.slug,
        description: league.description,
        websiteUrl: league.websiteUrl,
        instagramUrl: league.instagramUrl,
        platform: [...league.platform],
        gameMode: league.gameMode,
        country: league.country,
        fetchSource: league.fetchSource,
        fetchUrl: league.fetchUrl,
      },
    });

    console.log(`  ✅ ${league.name}`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
