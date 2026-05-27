import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INFLUENCERS = [
  {
    name: "DjMaRiiO",
    slug: "djmariio",
    description: "Uno de los creadores más grandes de EA FC en español. Contenido de sobres, drafts y diversión.",
    youtubeChannelId: "UCi7TVXyvrIwqeS9tfYD8UDA",
    twitchUsername: "djmariio",
    twitterHandle: "DjMaRiiO",
    instagramHandle: "djmariio",
    country: "España",
    specialty: ["Sobres", "Drafts", "Entretenimiento"],
    platforms: ["PS5"],
    featured: true,
  },
  {
    name: "Gravesen",
    slug: "gravesen",
    description: "Equipos competitivos, análisis táctico y FUT Champions de alto nivel.",
    youtubeChannelId: "UC7ZoKxigVZNs1ajkdrJGPZw",
    twitchUsername: "gravesen09",
    twitterHandle: "Gravesen09",
    country: "España",
    specialty: ["Competitivo", "Tácticas", "FUT Champions"],
    platforms: ["PS5"],
    featured: true,
  },
  {
    name: "Obrun",
    slug: "obrun",
    description: "Guías, tácticas meta y análisis detallado para mejorar tu nivel.",
    youtubeChannelId: "UCnAX1VpQzSFLT0M660OEK1w",
    twitterHandle: "ObrunFifa",
    country: "España",
    specialty: ["Guías", "Tácticas", "Meta"],
    platforms: ["PS5", "PC"],
    featured: false,
  },
  {
    name: "Spursito",
    slug: "spursito",
    description: "Entretenimiento puro, carreras a leyenda y contenido variado de EA FC.",
    youtubeChannelId: "UC8h85qEsJ25Os5THPu6QpHg",
    twitchUsername: "spursito",
    twitterHandle: "Spursito",
    instagramHandle: "spursito",
    country: "España",
    specialty: ["Entretenimiento", "Carreras", "Challenges"],
    platforms: ["PS5"],
    featured: false,
  },
  {
    name: "Luquitas Camino",
    slug: "luquitas-camino",
    description: "Creador argentino de EA FC. Contenido entretenido, sobres y gameplays.",
    youtubeChannelId: "UCsOchp7D-CFXQEaupsIM7Qg",
    country: "Argentina",
    specialty: ["Entretenimiento", "Sobres", "Drafts"],
    platforms: ["PS5"],
    featured: true,
  },
  {
    name: "GaboGames",
    slug: "gabogames",
    description: "Contenido variado de EA FC, challenges y entretenimiento latino.",
    youtubeChannelId: "UCVkWyVzpzI16heVnkhckFxQ",
    country: "Latinoamérica",
    specialty: ["Entretenimiento", "Challenges", "Sobres"],
    platforms: ["PS5"],
    featured: false,
  },
  {
    name: "pollichris",
    slug: "pollichris",
    description: "Creador de contenido EA FC con foco en competitivo y tácticas.",
    youtubeChannelId: "UCH_QuBR0ic2OdHtmQKr6hzA",
    country: "Latinoamérica",
    specialty: ["Competitivo", "Tácticas", "FUT Champions"],
    platforms: ["PS5"],
    featured: false,
  },
  {
    name: "PatanRex",
    slug: "patanrex",
    description: "Entretenimiento, challenges y gameplays de EA FC.",
    youtubeChannelId: "UCy1SoU70_KvlJmXJ4BttHeg",
    country: "Latinoamérica",
    specialty: ["Entretenimiento", "Challenges", "Carreras"],
    platforms: ["PS5"],
    featured: false,
  },
  {
    name: "Clausinho",
    slug: "clausinho",
    description: "Análisis tácticos, meta y guías para mejorar en EA FC.",
    youtubeChannelId: "UC2Eix0bcDHHVKyzX3EIDw7w",
    country: "Argentina",
    specialty: ["Tácticas", "Meta", "Guías"],
    platforms: ["PS5"],
    featured: true,
  },
  {
    name: "FraFilter",
    slug: "frafilter",
    description: "Trading, SBCs y plantillas rentables de EA FC.",
    youtubeChannelId: "UCbunHalkywapRjBthVxkHzw",
    country: "Argentina",
    specialty: ["Trading", "SBCs", "Plantillas"],
    platforms: ["PS5"],
    featured: false,
  },
  {
    name: "ConanGW",
    slug: "conangw",
    description: "Contenido competitivo y entretenimiento de EA FC.",
    youtubeChannelId: "UCfQQ3GyHhHsqxkrgYo2RgIg",
    country: "Latinoamérica",
    specialty: ["Competitivo", "Entretenimiento", "FUT Champions"],
    platforms: ["PS5"],
    featured: false,
  },
];

// Slugs to deactivate (removed from the platform)
const DEACTIVATE_SLUGS = ["kun-aguero", "neiragaming", "elgranmeza"];

async function main() {
  console.log("🎬 Seeding influencers...");

  // Deactivate removed influencers
  for (const slug of DEACTIVATE_SLUGS) {
    await prisma.influencer.updateMany({
      where: { slug },
      data: { active: false },
    });
  }
  console.log(`🗑️ Deactivated ${DEACTIVATE_SLUGS.length} influencers`);

  for (const data of INFLUENCERS) {
    await prisma.influencer.upsert({
      where: { slug: data.slug },
      update: {
        name: data.name,
        description: data.description,
        youtubeChannelId: data.youtubeChannelId,
        twitchUsername: "twitchUsername" in data ? data.twitchUsername : null,
        twitterHandle: "twitterHandle" in data ? data.twitterHandle : null,
        instagramHandle: "instagramHandle" in data ? data.instagramHandle : null,
        tiktokHandle: "tiktokHandle" in data ? (data as Record<string, unknown>).tiktokHandle as string : null,
        country: data.country,
        specialty: data.specialty,
        platforms: data.platforms,
        featured: data.featured,
        active: true,
      },
      create: data,
    });
  }

  console.log(`✅ ${INFLUENCERS.length} influencers seeded`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
