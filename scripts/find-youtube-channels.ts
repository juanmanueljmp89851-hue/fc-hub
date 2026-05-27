/**
 * Utility: busca channel IDs de YouTube por nombre.
 * Uso: npx tsx scripts/find-youtube-channels.ts "DjMaRiiO" "Gravesen" "Spursito"
 * Requiere YOUTUBE_API_KEY en .env.local
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
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

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.error("❌ Falta YOUTUBE_API_KEY en .env / .env.local");
  process.exit(1);
}

const names = process.argv.slice(2);
if (names.length === 0) {
  console.log("Uso: npx tsx scripts/find-youtube-channels.ts <nombre1> <nombre2> ...");
  process.exit(0);
}

async function searchChannel(query: string) {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "channel",
    maxResults: "3",
    key: API_KEY!,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  const data = await res.json();

  if (data.error) {
    console.error(`❌ Error buscando "${query}":`, data.error.message);
    return;
  }

  console.log(`\n🔍 "${query}":`);
  for (const item of data.items ?? []) {
    const id = item.snippet.channelId ?? item.id.channelId;
    console.log(`   ${item.snippet.title} → ${id}`);
  }
}

async function main() {
  for (const name of names) {
    await searchChannel(name);
  }
}

main();
