import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

const envPath = resolve(process.cwd(), ".env.local");
try {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const prisma = new PrismaClient();

const REAL_CHANNELS: Record<string, string | null> = {
  "djmariio": "UCi7TVXyvrIwqeS9tfYD8UDA",
  "gravesen": "UC7ZoKxigVZNs1ajkdrJGPZw",
  "obrun": "UCnAX1VpQzSFLT0M660OEK1w",
  "spursito": "UC8h85qEsJ25Os5THPu6QpHg",
  "neiragaming": "UCZq7JXJDge75TOJc4yQ75XA",
  "kun-aguero": "UCMl6IV2MR5W2gg4qHYAqcoQ",
  "elgranmeza": null,
};

async function main() {
  for (const [slug, channelId] of Object.entries(REAL_CHANNELS)) {
    await prisma.influencer.update({
      where: { slug },
      data: { youtubeChannelId: channelId },
    });
    console.log(`✅ ${slug} → ${channelId ?? "(sin canal)"}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
