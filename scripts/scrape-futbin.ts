/**
 * FUTBIN Scraper — Extrae cartas especiales de FC 26
 *
 * Uso:
 *   npx tsx scripts/scrape-futbin.ts                  # Scrape homepage (latest)
 *   npx tsx scripts/scrape-futbin.ts --promo tots     # Scrape TOTS specifically
 *   npx tsx scripts/scrape-futbin.ts --pages 5        # Scrape 5 pages of specials
 *   npx tsx scripts/scrape-futbin.ts --bee --rotate   # ScrapingBee + daily rotation
 *
 * Fallback: si FUTBIN banea, cambiar SOURCE a "futgg" o "futwiz"
 */

import { PrismaClient } from "@prisma/client";

// ScraperAPI mode: use cheerio for HTML parsing, no browser needed
const USE_SCRAPER_API = process.argv.includes("--bee");
const SCRAPER_API_KEY = process.env.SCRAPERAPI_KEY ?? "";
// Rotation mode: scrape a subset of squads per day to stay within credit budget
const USE_ROTATION = process.argv.includes("--rotate");
const SQUADS_PER_DAY = 6;

// Lazy-loaded modules (conditional on mode)
let chromium: any;
let stealth: any;
type Page = import("playwright").Page;
let cheerioLoad: any;

async function loadDeps() {
  if (USE_SCRAPER_API) {
    const cheerioMod = await import("cheerio");
    cheerioLoad = cheerioMod.load;
  } else {
    const pw = await import("playwright-extra");
    chromium = pw.chromium;
    const stealthMod = await import("puppeteer-extra-plugin-stealth");
    stealth = stealthMod.default;
    chromium.use(stealth());
  }
}

const prisma = new PrismaClient();

// ─── CONFIG ──────────────────────────────────────────────────

const SOURCE = process.env.SCRAPE_SOURCE ?? "futbin";

const FUTBIN_BASE = "https://www.futbin.com";
// Supports comma-separated versions: --version=all_specials,end_of_era,sbc_set
const FUTBIN_VERSIONS = (process.argv.find((a) => a.startsWith("--version="))?.split("=")[1] ?? "all_specials").split(",");
// Supports squad-based filters (new FUTBIN format): --squad=PrimeHeroes
const FUTBIN_SQUADS = (process.argv.find((a) => a.startsWith("--squad="))?.split("=")[1] ?? "").split(",").filter(Boolean);
// --daily: also scrape /home-tab/new-players (today's new cards)
const SCRAPE_DAILY = process.argv.includes("--daily");
// --auto: discover available versions from FUTBIN dropdown automatically
const AUTO_VERSIONS = process.argv.includes("--auto");
const FUTBIN_NEW_PLAYERS_URL = `${FUTBIN_BASE}/home-tab/new-players`;

function futbinPlayersUrl(version: string, page: number): string {
  return `${FUTBIN_BASE}/26/players?page=${page}&version=${version}&sort=date_added&order=desc`;
}
function futbinSquadUrl(squad: string, page: number): string {
  return `${FUTBIN_BASE}/26/players?page=${page}&p_squad=${squad}&sort=date_added&order=desc`;
}

// Map FUTBIN p_squad slugs → forced promo (overrides inferPromo)
const SQUAD_MAP: Record<string, { cardType: string; promo: string; order: number }> = {
  // Greats of the Game / Trophy Titans
  GreatsOfTheGame: { cardType: "icon", promo: "Greats of the Game Icon", order: 113 },
  TrophyTitanIcons: { cardType: "icon", promo: "Greats of the Game Icon", order: 113 },
  TrophyTitanIcons2: { cardType: "icon", promo: "Greats of the Game Icon", order: 113 },
  TrophyTitanHeroes: { cardType: "hero", promo: "Greats of the Game Hero", order: 112.5 },
  TrophyTitanHeroes2: { cardType: "hero", promo: "Greats of the Game Hero", order: 112.5 },
  // Star Performers / National Pride
  StarPerformers: { cardType: "national_pride", promo: "National Pride", order: 109 },
  // Path to Glory
  PathToGlory: { cardType: "path_to_glory", promo: "Path To Glory", order: 110 },
  PathToGloryTeam2: { cardType: "path_to_glory", promo: "Path To Glory", order: 110 },
  // UCL/UEL/UECL/UWCL Winners
  UCLWinners: { cardType: "special", promo: "UCL Camino a la Final", order: 60 },
  UELWinners: { cardType: "special", promo: "UEL Camino a la Final", order: 59 },
  UECLWinners: { cardType: "special", promo: "UECL Camino a la Final", order: 58 },
  UWCLWinners: { cardType: "special", promo: "UWCL Camino a la Final", order: 57 },
  UCLRTTF: { cardType: "special", promo: "UCL Camino a la Final", order: 60 },
  UELUECLRTTF: { cardType: "special", promo: "UEL Camino a la Final", order: 59 },
  "UWCL RTTF": { cardType: "special", promo: "UWCL Camino a la Final", order: 57 },
  // Prime Heroes
  PrimeHeroes: { cardType: "hero", promo: "Prime Heroes", order: 105 },
  // TOTS variants
  UltimateTOTSmale: { cardType: "tots", promo: "TOTS", order: 100 },
  UltimateTOTSfemale: { cardType: "tots", promo: "TOTS", order: 100 },
  PremierLeagueTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  LaLigaTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  BundesligaTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  SerieATOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  Ligue1TOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  EFLTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  MLSTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  LigaPortugalTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  LigaFTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  EredivisieTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  RestOfWorldTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  RestOfEuropeTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  SaudiProLeagueTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  SuperLigTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  NWSLTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  BWSLTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  FrauenBundesligaTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  D1ArkemaTOTS: { cardType: "tots", promo: "TOTS", order: 100 },
  // FUT Birthday
  FUTBirthday: { cardType: "special", promo: "FUT Birthday", order: 90 },
  FUTBirthdayTeam2: { cardType: "special", promo: "FUT Birthday", order: 90 },
  FUTBdayIconsHeroes: { cardType: "special", promo: "FUT Birthday", order: 90 },
  FUTBdayIconsHeroes2: { cardType: "special", promo: "FUT Birthday", order: 90 },
  // Future Stars
  FutureStars: { cardType: "special", promo: "Estrellas del Futuro", order: 85 },
  FutureStarsTeam2: { cardType: "special", promo: "Estrellas del Futuro", order: 85 },
  FSIconsandHeroes: { cardType: "special", promo: "Estrellas del Futuro", order: 85 },
  FSIconsandHeroes2: { cardType: "special", promo: "Estrellas del Futuro", order: 85 },
  // Fantasy FC
  FantasyFC: { cardType: "special", promo: "Fantasy FC", order: 35 },
  FantasyFCTeam2: { cardType: "special", promo: "Fantasy FC", order: 35 },
  FantasyFCHeroes: { cardType: "special", promo: "Fantasy FC", order: 35 },
  FantasyFCHeroes2: { cardType: "special", promo: "Fantasy FC", order: 35 },
  FantasyFPL: { cardType: "special", promo: "Fantasy FC", order: 35 },
  // Knockout Royalty
  KnockoutRoyalty: { cardType: "special", promo: "Knockout Royalty", order: 25 },
  KORoyaltyIconsHeroes: { cardType: "special", promo: "Knockout Royalty", order: 25 },
  // Answer The Call / Festival of Football
  AnswerTheCall: { cardType: "special", promo: "Festival de Fútbol", order: 20 },
};

// Map FUTBIN version filter slugs to our promo names
const PROMO_MAP: Record<string, { cardType: string; promo: string; order: number }> = {
  // Newest promos first (higher order = newer)
  greats_of_the_game_icon: { cardType: "icon", promo: "Greats of the Game Icon", order: 113 },
  greats_of_the_game_hero: { cardType: "hero", promo: "Greats of the Game Hero", order: 112.5 },
  greats_of_the_game: { cardType: "icon", promo: "Greats of the Game Icon", order: 113 },
  icon_journey_of_nations: { cardType: "icon", promo: "Icon Journey Of Nations", order: 111 },
  path_to_glory: { cardType: "path_to_glory", promo: "Path To Glory", order: 110 },
  national_pride_red: { cardType: "national_pride_red", promo: "National Pride Red", order: 109.5 },
  national_pride: { cardType: "national_pride", promo: "National Pride", order: 109 },
  prime_heroes: { cardType: "hero", promo: "Prime Heroes", order: 105 },
  tots: { cardType: "tots", promo: "TOTS", order: 100 },
  tots_champions: { cardType: "tots", promo: "TOTS Champions", order: 99 },
  tots_honourable: { cardType: "tots", promo: "TOTS Menciones Honoríficas", order: 98 },
  fut_birthday: { cardType: "special", promo: "FUT Birthday", order: 90 },
  future_stars: { cardType: "special", promo: "Estrellas del Futuro", order: 85 },
  thunderstruck: { cardType: "special", promo: "Thunderstruck", order: 80 },
  toty: { cardType: "toty", promo: "TOTY", order: 75 },
  toty_honourable: { cardType: "toty", promo: "TOTY Mención Honorífica", order: 74 },
  winter_wildcards: { cardType: "special", promo: "Winter Wildcards", order: 70 },
  fc_pro_live: { cardType: "special", promo: "FC Pro Live", order: 65 },
  ucl_rttf: { cardType: "special", promo: "UCL Camino a la Final", order: 60 },
  uel_rttf: { cardType: "special", promo: "UEL Camino a la Final", order: 59 },
  uecl_rttf: { cardType: "special", promo: "UECL Camino a la Final", order: 58 },
  uwcl_rttf: { cardType: "special", promo: "UWCL Camino a la Final", order: 57 },
  totw: { cardType: "special", promo: "Equipo de la Semana", order: 50 },
  potm: { cardType: "special", promo: "Jugador del Mes", order: 45 },
  sbc: { cardType: "special", promo: "SBC", order: 42 },
  showdown: { cardType: "special", promo: "Showdown", order: 40 },
  fantasy_fc: { cardType: "special", promo: "Fantasy FC", order: 35 },
  cornerstones: { cardType: "special", promo: "Cornerstones", order: 30 },
  knockout_royalty: { cardType: "special", promo: "Knockout Royalty", order: 25 },
  end_of_era: { cardType: "special", promo: "Fin de una Era", order: 22 },
  premium_world_tour: { cardType: "special", promo: "Premium World Tour", order: 21 },
  fof: { cardType: "special", promo: "Festival de Fútbol", order: 20 },
  icon: { cardType: "icon", promo: "Ícono", order: 10 },
  hero: { cardType: "hero", promo: "Héroe", order: 9 },
  gold_rare: { cardType: "gold_rare", promo: "Oro Raro", order: 1 },
};

// ─── SCRAPERAPI FETCH ───────────────────────────────────────

async function fetchWithScraperAPI(url: string): Promise<string> {
  const apiUrl = new URL("https://api.scraperapi.com/");
  apiUrl.searchParams.set("api_key", SCRAPER_API_KEY);
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("render", "true");
  apiUrl.searchParams.set("ultra_premium", "true");
  apiUrl.searchParams.set("wait_for_selector", "tr.player-row");
  apiUrl.searchParams.set("country_code", "us");

  const res = await fetch(apiUrl.toString(), { signal: AbortSignal.timeout(90000) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ScraperAPI error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.text();
}

function parsePlayerListHtml(html: string, sourceUrl: string): ScrapedCard[] {
  const $ = cheerioLoad(html);
  const results: ScrapedCard[] = [];

  $("tr.player-row").each((_, row) => {
    try {
      const $row = $(row);
      const link = $row.find("a.player-row-playercard");
      const href = link.attr("href") ?? "";
      const futbinIdMatch = href.match(/\/26\/player\/(\d+)/);
      if (!futbinIdMatch) return;
      const futbinId = parseInt(futbinIdMatch[1]);

      const name = $row.find(".table-player-name").text().trim();
      if (!name) return;

      const faceSrc = $row.find("img.playercard-26-special-img, img[src*='players/p']").attr("src") ?? "";
      const eaIdMatch = faceSrc.match(/players\/p?(\d+)\.png/);
      const eaId = eaIdMatch ? parseInt(eaIdMatch[1]) : 0;

      const overall = parseInt($row.find("td.table-rating .rating-square").text().trim() || "0");

      const posTd = $row.find("td.table-pos");
      const mainPos = posTd.find(".table-pos-main span:first-child").text().trim();
      const altPosText = posTd.find(".xs-font").text().trim();
      const altPositions = altPosText ? altPosText.split(",").map(s => s.trim()).filter(Boolean) : [];

      const pace = parseInt($row.find("td.table-pace .table-key-stats").text().trim() || "0");
      const shooting = parseInt($row.find("td.table-shooting .table-key-stats").text().trim() || "0");
      const passing = parseInt($row.find("td.table-passing .table-key-stats").text().trim() || "0");
      const dribbling = parseInt($row.find("td.table-dribbling .table-key-stats").text().trim() || "0");
      const defending = parseInt($row.find("td.table-defending .table-key-stats").text().trim() || "0");
      const physical = parseInt($row.find("td.table-physicality .table-key-stats").text().trim() || "0");

      const cardSrc = $row.find("img.playercard-s-26-bg, img[src*='cards/tiny/']").attr("src") ?? "";
      const cardMatch = cardSrc.match(/cards\/tiny\/(.+?)\.png/);
      const cardImageId = cardMatch?.[1] ?? "";

      const pricePs = $row.find("td.platform-ps-only .price").text().trim().replace(/[^\d.KMk]/g, "");
      const pricePc = $row.find("td.platform-pc-only .price").text().trim().replace(/[^\d.KMk]/g, "");

      const fbRatingText = $row.find("span.futbin-rating-tag").text().trim();
      const futbinRating = fbRatingText ? parseFloat(fbRatingText) : undefined;

      const smText = $row.find("td.table-skills").text().trim();
      const wfText = $row.find("td.table-weak-foot").text().trim();
      const skillMoves = smText ? parseInt(smText) : undefined;
      const weakFoot = wfText ? parseInt(wfText) : undefined;

      const footSrc = $row.find("td.table-foot img").attr("src") ?? "";
      const foot = footSrc.includes("foot-left") ? "Izquierdo" : footSrc.includes("foot-right") ? "Derecho" : undefined;

      const heightText = $row.find("td.table-height .text-center").text().trim();
      const heightMatch = heightText.match(/(\d+)cm/);
      const height = heightMatch ? parseInt(heightMatch[1]) : undefined;

      const promoInfo = inferPromo(cardImageId);
      results.push({
        futbinId,
        eaId,
        name,
        overall,
        position: mainPos,
        altPositions,
        pace, shooting, passing, dribbling, defending, physical,
        club: "", league: "", nation: "",
        cardType: promoInfo.cardType,
        promo: promoInfo.promo,
        promoOrder: promoInfo.order,
        skillMoves, weakFoot, foot, height, futbinRating,
        pricePs: pricePs || undefined,
        pricePc: pricePc || undefined,
        cardImageId,
        imageUrl: eaId > 0 ? `https://cdn.futbin.com/content/fifa26/img/players/p${eaId}.png` : undefined,
        sourceUrl: `https://www.futbin.com${href}`,
      });
    } catch {
      // Skip malformed rows
    }
  });

  return results;
}

// ─── ROTATION LOGIC ─────────────────────────────────────────

function getRotationSquads(): string[] {
  const allSquads = Object.keys(SQUAD_MAP);
  allSquads.sort((a, b) => (SQUAD_MAP[b]?.order ?? 0) - (SQUAD_MAP[a]?.order ?? 0));
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const totalGroups = Math.ceil(allSquads.length / SQUADS_PER_DAY);
  const groupIndex = dayOfYear % totalGroups;
  const start = groupIndex * SQUADS_PER_DAY;
  const todaySquads = allSquads.slice(start, start + SQUADS_PER_DAY);
  console.log(`  🔄 Rotación día ${dayOfYear} → grupo ${groupIndex + 1}/${totalGroups}: ${todaySquads.join(", ")}`);
  return todaySquads;
}

// ─── SCRAPER ─────────────────────────────────────────────────

interface ScrapedCard {
  futbinId: number;
  eaId: number;
  name: string;
  commonName?: string;
  overall: number;
  position: string;
  altPositions: string[];
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  club: string;
  league: string;
  nation: string;
  cardType: string;
  promo: string;
  promoOrder: number;
  skillMoves?: number;
  weakFoot?: number;
  foot?: string;
  height?: number;
  futbinRating?: number;
  pricePs?: string;
  pricePc?: string;
  cardImageId?: string;
  imageUrl?: string;
  sourceUrl: string;
}

async function scrapeFutbinPlayerList(page: Page, url: string): Promise<ScrapedCard[]> {
  console.log(`  → Navegando a: ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

  // Wait for table to render + simulate human scroll
  await page.waitForTimeout(3000 + Math.random() * 2000);
  await page.evaluate(() => window.scrollBy(0, 300 + Math.random() * 400));
  await page.waitForTimeout(1000 + Math.random() * 1500);

  // Close cookie consent — FUTBIN uses Cookiebot
  try {
    const consentBtn = page.locator("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll");
    if (await consentBtn.count() > 0) {
      await consentBtn.first().click();
      console.log("  ✓ Cookie consent cerrado");
      await page.waitForTimeout(1000);
    }
  } catch {
    // No consent popup — fine
  }

  // Wait for player rows
  await page.waitForSelector("tr.player-row", { timeout: 15000 }).catch(() => {
    console.log("  ⚠ No se encontraron filas de jugadores");
  });

  // Extract data from FUTBIN player table
  // DOM structure (verified 2026-05-28):
  //   tr.player-row > td.table-name        — link + images
  //                  > td.table-rating      — overall in div.rating-square
  //                  > td.table-pos         — position + alt
  //                  > td.table-price (x2)  — PS / PC prices
  //                  > td (futbin rating)   — span.futbin-rating-tag
  //                  > td.table-foot        — img foot-left/right.svg
  //                  > td.table-skills      — SM
  //                  > td.table-weak-foot   — WF
  //                  > td.table-pace/shooting/passing/dribbling/defending/physicality
  //   Player face img: class="playercard-26-special-img" src contains players/p{eaId}.png
  //   Card bg img: class="playercard-s-26-bg" src contains cards/tiny/{cardImageId}.png
  const cards = await page.evaluate(() => {
    const rows = document.querySelectorAll("tr.player-row");
    const results: Array<Record<string, unknown>> = [];

    for (const row of rows) {
      try {
        // --- Link & FUTBIN ID ---
        const link = row.querySelector("a.player-row-playercard") as HTMLAnchorElement;
        if (!link) continue;
        const href = link.getAttribute("href") ?? "";
        const futbinIdMatch = href.match(/\/26\/player\/(\d+)/);
        if (!futbinIdMatch) continue;
        const futbinId = parseInt(futbinIdMatch[1]);

        // --- Player name ---
        const nameEl = row.querySelector(".table-player-name") as HTMLElement;
        const name = nameEl?.textContent?.trim() ?? "";
        if (!name) continue;

        // --- EA ID from player face image ---
        // FC26 format: players/p{eaId}.png (note "p" prefix)
        const faceImg = row.querySelector("img.playercard-26-special-img, img[src*='players/p']") as HTMLImageElement;
        const faceSrc = faceImg?.getAttribute("src") ?? "";
        const eaIdMatch = faceSrc.match(/players\/p?(\d+)\.png/);
        const eaId = eaIdMatch ? parseInt(eaIdMatch[1]) : 0;

        // --- Overall rating ---
        const ratingEl = row.querySelector("td.table-rating .rating-square") as HTMLElement;
        const overall = parseInt(ratingEl?.textContent?.trim() ?? "0");

        // --- Position (main + alt) ---
        const posTd = row.querySelector("td.table-pos") as HTMLElement;
        const mainPos = posTd?.querySelector(".table-pos-main span:first-child")?.textContent?.trim() ?? "";
        const altPosText = posTd?.querySelector(".xs-font")?.textContent?.trim() ?? "";
        const altPositions = altPosText ? altPosText.split(",").map((s: string) => s.trim()).filter(Boolean) : [];

        // --- Stats (PAC SHO PAS DRI DEF PHY) ---
        const pace = parseInt(row.querySelector("td.table-pace .table-key-stats")?.textContent?.trim() ?? "0");
        const shooting = parseInt(row.querySelector("td.table-shooting .table-key-stats")?.textContent?.trim() ?? "0");
        const passing = parseInt(row.querySelector("td.table-passing .table-key-stats")?.textContent?.trim() ?? "0");
        const dribbling = parseInt(row.querySelector("td.table-dribbling .table-key-stats")?.textContent?.trim() ?? "0");
        const defending = parseInt(row.querySelector("td.table-defending .table-key-stats")?.textContent?.trim() ?? "0");
        const physical = parseInt(row.querySelector("td.table-physicality .table-key-stats")?.textContent?.trim() ?? "0");

        // --- Card background image ID ---
        const cardBgImg = row.querySelector("img.playercard-s-26-bg, img[src*='cards/tiny/']") as HTMLImageElement;
        const cardSrc = cardBgImg?.getAttribute("src") ?? "";
        const cardMatch = cardSrc.match(/cards\/tiny\/(.+?)\.png/);
        const cardImageId = cardMatch?.[1] ?? "";

        // --- Prices ---
        const psPriceTd = row.querySelector("td.platform-ps-only .price") as HTMLElement;
        const pcPriceTd = row.querySelector("td.platform-pc-only .price") as HTMLElement;
        const pricePs = psPriceTd?.textContent?.trim().replace(/[^\d.KMk]/g, "") ?? "";
        const pricePc = pcPriceTd?.textContent?.trim().replace(/[^\d.KMk]/g, "") ?? "";

        // --- FUTBIN rating ---
        const fbRatingEl = row.querySelector("span.futbin-rating-tag") as HTMLElement;
        const futbinRating = fbRatingEl ? parseFloat(fbRatingEl.textContent?.trim() ?? "0") : undefined;

        // --- Skill Moves & Weak Foot ---
        const smTd = row.querySelector("td.table-skills") as HTMLElement;
        const wfTd = row.querySelector("td.table-weak-foot") as HTMLElement;
        const skillMoves = smTd ? parseInt(smTd.textContent?.trim() ?? "0") : undefined;
        const weakFoot = wfTd ? parseInt(wfTd.textContent?.trim() ?? "0") : undefined;

        // --- Foot ---
        const footImg = row.querySelector("td.table-foot img") as HTMLImageElement;
        const footSrc = footImg?.getAttribute("src") ?? "";
        const foot = footSrc.includes("foot-left") ? "Izquierdo" : footSrc.includes("foot-right") ? "Derecho" : undefined;

        // --- Height ---
        const heightTd = row.querySelector("td.table-height .text-center") as HTMLElement;
        const heightText = heightTd?.textContent?.trim() ?? "";
        const heightMatch = heightText.match(/(\d+)cm/);
        const height = heightMatch ? parseInt(heightMatch[1]) : undefined;

        results.push({
          futbinId,
          eaId,
          name,
          overall,
          position: mainPos,
          altPositions,
          pace,
          shooting,
          passing,
          dribbling,
          defending,
          physical,
          pricePs,
          pricePc,
          futbinRating,
          skillMoves,
          weakFoot,
          foot,
          height,
          cardImageId,
          sourceUrl: `https://www.futbin.com${href}`,
        });
      } catch {
        // Skip malformed rows
      }
    }

    return results;
  });

  console.log(`  ✓ ${cards.length} cartas extraídas`);

  // Map to ScrapedCard with promo info from card image ID
  return cards.map((c) => {
    const promoInfo = inferPromo(c.cardImageId as string);
    return {
      futbinId: c.futbinId as number,
      eaId: c.eaId as number,
      name: c.name as string,
      overall: c.overall as number,
      position: c.position as string,
      altPositions: (c.altPositions as string[]) ?? [],
      pace: c.pace as number,
      shooting: c.shooting as number,
      passing: c.passing as number,
      dribbling: c.dribbling as number,
      defending: c.defending as number,
      physical: c.physical as number,
      club: "",
      league: "",
      nation: "",
      cardType: promoInfo.cardType,
      promo: promoInfo.promo,
      promoOrder: promoInfo.order,
      skillMoves: c.skillMoves as number | undefined,
      weakFoot: c.weakFoot as number | undefined,
      foot: c.foot as string | undefined,
      height: c.height as number | undefined,
      futbinRating: c.futbinRating as number | undefined,
      pricePs: c.pricePs as string | undefined,
      pricePc: c.pricePc as string | undefined,
      cardImageId: c.cardImageId as string,
      imageUrl:
        (c.eaId as number) > 0
          ? `https://cdn.futbin.com/content/fifa26/img/players/p${c.eaId as number}.png`
          : undefined,
      sourceUrl: c.sourceUrl as string,
    };
  });
}

function inferPromo(cardImageId: string): {
  cardType: string;
  promo: string;
  order: number;
} {
  if (!cardImageId) return { cardType: "special", promo: "Especial", order: 15 };

  const id = cardImageId.toLowerCase();

  // Greats of the Game — Hero vs Icon
  if (id.includes("gotg_hero") || id.includes("greats_of_the_game_hero")) return PROMO_MAP.greats_of_the_game_hero;
  if (id.includes("trophy_titans")) return PROMO_MAP.greats_of_the_game_icon;
  if (id.includes("greats_of_the_game") || id.includes("gotg")) return PROMO_MAP.greats_of_the_game_icon;
  if (id.includes("ecl_champion") || id.includes("champion_icon")) return PROMO_MAP.greats_of_the_game_icon;
  if (id.includes("journey_of_nations") || id.includes("jon")) return PROMO_MAP.icon_journey_of_nations;
  if (id.includes("path_to_glory") || id.includes("ptg")) return PROMO_MAP.path_to_glory;
  if (id.includes("national_pride_red")) return PROMO_MAP.national_pride_red;
  if (id.includes("national_pride")) return PROMO_MAP.national_pride;

  // Prime Heroes — check before generic hero
  if (id.includes("prime_hero")) return PROMO_MAP.prime_heroes;
  if (id.includes("honourable_mention") || id.includes("honorable_mention")) return PROMO_MAP.tots_honourable;
  if (id.includes("tots") || id.includes("team_of_the_season")) return PROMO_MAP.tots;
  if (id.includes("toty") && id.includes("hon")) return PROMO_MAP.toty_honourable;
  if (id.includes("toty")) return PROMO_MAP.toty;
  if (id.includes("uwcl")) return PROMO_MAP.uwcl_rttf;
  if (id.includes("birthday")) return PROMO_MAP.fut_birthday;
  if (id.includes("future")) return PROMO_MAP.future_stars;
  if (id.includes("thunder")) return PROMO_MAP.thunderstruck;
  if (id.includes("winter")) return PROMO_MAP.winter_wildcards;
  if (id.includes("fc_pro")) return PROMO_MAP.fc_pro_live;
  if (id.includes("ucl_rttf")) return PROMO_MAP.ucl_rttf;
  if (id.includes("uel_rttf")) return PROMO_MAP.uel_rttf;
  if (id.includes("uecl_rttf")) return PROMO_MAP.uecl_rttf;
  if (id.includes("totw")) return PROMO_MAP.totw;
  if (id.includes("potm")) return PROMO_MAP.potm;
  if (id.includes("sbc")) return PROMO_MAP.sbc;
  if (id.includes("showdown")) return PROMO_MAP.showdown;
  if (id.includes("fantasy")) return PROMO_MAP.fantasy_fc;
  if (id.includes("corner")) return PROMO_MAP.cornerstones;
  if (id.includes("knockout")) return PROMO_MAP.knockout_royalty;
  if (id.includes("end_of_era")) return PROMO_MAP.end_of_era;
  if (id.includes("premium_world_tour") || id.includes("world_tour")) return PROMO_MAP.premium_world_tour;
  if (id.includes("festival_of_football_icon") || id.includes("fof_icon")) return { cardType: "icon", promo: "Festival of Football Icon", order: 115 };
  if (id.includes("fof") || id.includes("answer") || id.includes("festival_of_football")) return PROMO_MAP.fof;
  if (id.includes("icon")) return PROMO_MAP.icon;
  if (id.includes("hero")) return PROMO_MAP.hero;
  if (id.includes("gold") && id.includes("rare")) return PROMO_MAP.gold_rare;

  // Fallback: auto-generate promo name from cardImageId
  // e.g., "21_prime_heroes" → "Prime Heroes"
  // e.g., "135_summer_stars" → "Summer Stars"
  const autoName = cardImageId
    .replace(/^\d+_/, "")          // strip leading number prefix
    .replace(/_/g, " ")            // underscores → spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Title Case

  if (autoName && autoName.length > 2) {
    console.log(`  ℹ️  Promo auto-detectada desde cardImageId: "${autoName}" (${cardImageId})`);
    return { cardType: "special", promo: autoName, order: 15 };
  }

  return { cardType: "special", promo: "Especial", order: 15 };
}

// ─── SCRAPE DAILY NEW PLAYERS TAB ───────────────────────────

async function scrapeFutbinNewPlayers(page: Page): Promise<ScrapedCard[]> {
  console.log(`  → Navegando a: ${FUTBIN_NEW_PLAYERS_URL}`);
  await page.goto(FUTBIN_NEW_PLAYERS_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);

  // Close cookie consent
  try {
    const consentBtn = page.locator("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll");
    if (await consentBtn.count() > 0) {
      await consentBtn.first().click();
      await page.waitForTimeout(1000);
    }
  } catch {}

  // The new-players tab may use same player-row table or a card grid.
  // Try player-row first (FUTBIN standard table)
  const hasTable = await page.locator("tr.player-row").count();
  if (hasTable > 0) {
    console.log(`  ✓ Formato tabla detectado (${hasTable} filas)`);
    return scrapeFutbinPlayerList(page, FUTBIN_NEW_PLAYERS_URL);
  }

  // Alternative: card-style layout (grid of player cards with links)
  // FUTBIN /home-tab pages use .home-new-player-card or similar
  const cards = await page.evaluate(() => {
    // Try multiple selectors for FUTBIN's new-players widget
    const playerLinks = document.querySelectorAll("a[href*='/26/player/']");
    const results: Array<Record<string, unknown>> = [];

    for (const link of playerLinks) {
      try {
        const href = link.getAttribute("href") ?? "";
        const futbinIdMatch = href.match(/\/26\/player\/(\d+)/);
        if (!futbinIdMatch) continue;
        const futbinId = parseInt(futbinIdMatch[1]);

        // Try to find player info within or near the link
        const container = link.closest("[class*='player']") ?? link;

        // Name
        const nameEl = container.querySelector("[class*='name'], .player-name, .pName") as HTMLElement;
        const name = nameEl?.textContent?.trim() ?? link.textContent?.trim() ?? "";
        if (!name || name.length > 50) continue; // skip garbage

        // Rating
        const ratingEl = container.querySelector("[class*='rating'], .rating") as HTMLElement;
        const overall = parseInt(ratingEl?.textContent?.trim() ?? "0");

        // Card image ID from card background
        const cardImg = container.querySelector("img[src*='cards/']") as HTMLImageElement;
        const cardSrc = cardImg?.getAttribute("src") ?? "";
        const cardMatch = cardSrc.match(/cards\/(?:tiny|small|s_|)\/?\/?(.+?)\.png/);
        const cardImageId = cardMatch?.[1] ?? "";

        // EA ID from player face
        const faceImg = container.querySelector("img[src*='players/']") as HTMLImageElement;
        const faceSrc = faceImg?.getAttribute("src") ?? "";
        const eaMatch = faceSrc.match(/players\/p?(\d+)\.png/);
        const eaId = eaMatch ? parseInt(eaMatch[1]) : 0;

        // Position
        const posEl = container.querySelector("[class*='pos'], .position") as HTMLElement;
        const position = posEl?.textContent?.trim() ?? "";

        results.push({
          futbinId,
          eaId,
          name,
          overall,
          position,
          cardImageId,
          altPositions: [],
          pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, physical: 0,
          sourceUrl: `https://www.futbin.com${href}`,
        });
      } catch {}
    }

    return results;
  });

  console.log(`  ✓ ${cards.length} cartas del formato card-grid`);

  return cards.map((c) => {
    const promoInfo = inferPromo(c.cardImageId as string);
    return {
      futbinId: c.futbinId as number,
      eaId: c.eaId as number,
      name: c.name as string,
      overall: c.overall as number,
      position: (c.position as string) || "?",
      altPositions: [],
      pace: c.pace as number,
      shooting: c.shooting as number,
      passing: c.passing as number,
      dribbling: c.dribbling as number,
      defending: c.defending as number,
      physical: c.physical as number,
      club: "",
      league: "",
      nation: "",
      cardType: promoInfo.cardType,
      promo: promoInfo.promo,
      promoOrder: promoInfo.order,
      cardImageId: c.cardImageId as string,
      imageUrl:
        (c.eaId as number) > 0
          ? `https://cdn.futbin.com/content/fifa26/img/players/p${c.eaId as number}.png`
          : undefined,
      sourceUrl: c.sourceUrl as string,
    };
  });
}

// ─── DATABASE ────────────────────────────────────────────────

/** Parse FUTBIN price string (e.g. "3.1M", "450K", "1,200") to integer */
function parsePrice(price: string): number | undefined {
  if (!price) return undefined;
  const clean = price.replace(/[,\s]/g, "").toUpperCase();
  if (clean.endsWith("M")) return Math.round(parseFloat(clean) * 1_000_000);
  if (clean.endsWith("K")) return Math.round(parseFloat(clean) * 1_000);
  const num = parseInt(clean);
  return isNaN(num) ? undefined : num;
}

async function upsertCards(cards: ScrapedCard[]): Promise<number> {
  let upserted = 0;

  for (const card of cards) {
    if (!card.eaId || card.eaId === 0) {
      console.log(`  ⚠ Saltando ${card.name} — sin EA ID`);
      continue;
    }

    // Skip if same eaId+cardImageId exists with a different cardType (avoids
    // duplicates when scraper uses "special" but DB has "end_of_era", "icon", etc.)
    if (card.cardImageId) {
      const existingVariant = await prisma.futCard.findFirst({
        where: { eaId: card.eaId, cardImageId: card.cardImageId, NOT: { cardType: card.cardType } },
        select: { id: true },
      });
      if (existingVariant) {
        continue;
      }
    }

    const pricePs = parsePrice(card.pricePs ?? "");
    const pricePc = parsePrice(card.pricePc ?? "");

    try {
      await prisma.futCard.upsert({
        where: {
          eaId_cardType: {
            eaId: card.eaId,
            cardType: card.cardType,
          },
        },
        update: {
          overall: card.overall || undefined,
          // Only update stats if non-zero (daily scraper returns 0s)
          ...(card.pace > 0 && { pace: card.pace }),
          ...(card.shooting > 0 && { shooting: card.shooting }),
          ...(card.passing > 0 && { passing: card.passing }),
          ...(card.dribbling > 0 && { dribbling: card.dribbling }),
          ...(card.defending > 0 && { defending: card.defending }),
          ...(card.physical > 0 && { physical: card.physical }),
          pricePs,
          pricePc,
          futbinRating: card.futbinRating,
          imageUrl: card.imageUrl,
          cardImageId: card.cardImageId,
          promo: card.promo,
          promoOrder: card.promoOrder,
          cardType: card.cardType,
          skillMoves: card.skillMoves,
          weakFoot: card.weakFoot,
          foot: card.foot,
          height: card.height,
        },
        create: {
          eaId: card.eaId,
          futbinId: card.futbinId,
          name: card.name,
          commonName: card.commonName,
          overall: card.overall,
          position: card.position,
          altPositions: card.altPositions,
          pace: card.pace,
          shooting: card.shooting,
          passing: card.passing,
          dribbling: card.dribbling,
          defending: card.defending,
          physical: card.physical,
          club: card.club,
          league: card.league,
          nation: card.nation,
          cardType: card.cardType,
          promo: card.promo,
          promoOrder: card.promoOrder,
          cardImageId: card.cardImageId,
          imageUrl: card.imageUrl,
          skillMoves: card.skillMoves,
          weakFoot: card.weakFoot,
          foot: card.foot,
          height: card.height,
          futbinRating: card.futbinRating,
          pricePs,
          pricePc,
          source: "futbin",
          sourceUrl: card.sourceUrl,
          releaseDate: new Date(),
        },
      });
      upserted++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  ✗ Error guardando ${card.name}: ${msg}`);
    }
  }

  return upserted;
}

// ─── AUTO-DISCOVER FUTBIN SQUADS ────────────────────────────

async function discoverFutbinSquads(page: Page): Promise<string[]> {
  console.log(`\n🔎 Auto-descubrimiento de squads FUTBIN...`);
  await page.goto(`${FUTBIN_BASE}/26/players`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);

  // Close cookie consent if present
  try {
    const consentBtn = page.locator("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll");
    if (await consentBtn.count() > 0) await consentBtn.first().click();
  } catch {}

  // Extract p_squad values from FUTBIN's promo filter dropdown
  const squads = await page.evaluate(() => {
    const found: string[] = [];
    // FUTBIN uses .filter-box.dropdown-sub-list with links containing ?p_squad=
    const links = Array.from(document.querySelectorAll(".filter-box a[href*='p_squad='], .dropdown-content a[href*='p_squad=']"));
    for (let i = 0; i < links.length; i++) {
      const href = (links[i] as HTMLAnchorElement).getAttribute("href") ?? "";
      const match = href.match(/p_squad=([^&]+)/);
      if (match && match[1]) found.push(match[1]);
    }
    return found.filter((v, i, a) => a.indexOf(v) === i);
  });

  if (squads.length > 0) {
    console.log(`  ✅ ${squads.length} squads descubiertas: ${squads.slice(0, 10).join(", ")}...`);
    return squads;
  }

  // Fallback: use all SQUAD_MAP keys
  console.log(`  ⚠ No se encontraron squads en dropdown. Usando SQUAD_MAP como fallback.`);
  const fallback = Object.keys(SQUAD_MAP);
  console.log(`  📋 ${fallback.length} squads desde SQUAD_MAP`);
  return fallback;
}

// ─── MAIN ────────────────────────────────────────────────────

async function main() {
  await loadDeps();

  const args = process.argv.slice(2);
  const pagesArg = args.find((a) => a.startsWith("--pages"));
  const maxPages = pagesArg ? parseInt(args[args.indexOf(pagesArg) + 1] ?? "3") : 3;

  const hasSquads = FUTBIN_SQUADS.length > 0;

  console.log(`\n🔍 Scraper FUTBIN FC 26 — ${new Date().toLocaleString("es-AR")}`);
  if (USE_SCRAPER_API) console.log(`   🐝 Modo ScraperAPI (IPs residenciales)`);
  if (USE_ROTATION) console.log(`   🔄 Rotación: ${SQUADS_PER_DAY} squads/día`);
  if (AUTO_VERSIONS) console.log(`   🤖 Modo automático: descubrimiento de versiones`);
  if (SCRAPE_DAILY) console.log(`   📅 Daily: /home-tab/new-players`);
  if (hasSquads) console.log(`   Squads: ${FUTBIN_SQUADS.join(", ")}`);
  if (!hasSquads && !SCRAPE_DAILY && !AUTO_VERSIONS && !USE_ROTATION) console.log(`   Versiones: ${FUTBIN_VERSIONS.join(", ")}`);
  console.log(`   Páginas por versión: ${maxPages}`);
  console.log(`   Fuente: ${SOURCE}\n`);

  if (USE_SCRAPER_API && !SCRAPER_API_KEY) {
    throw new Error("SCRAPERAPI_KEY no configurada. Setear como env var o secret.");
  }

  // ─── SCRAPINGBEE MODE ─────────────────────────────────────────
  if (USE_SCRAPER_API) {
    let allCards: ScrapedCard[] = [];
    const seen = new Set<string>();

    try {
      const squadsToScrape = USE_ROTATION
        ? getRotationSquads()
        : hasSquads
          ? FUTBIN_SQUADS
          : Object.keys(SQUAD_MAP);

      const targets = squadsToScrape.map((squad) => ({
        label: `Squad: ${squad}`,
        urlFn: (p: number) => futbinSquadUrl(squad, p),
        forcePromo: SQUAD_MAP[squad],
      }));

      let creditsUsed = 0;

      for (const target of targets) {
        console.log(`\n🏷️  ${target.label}`);

        for (let p = 1; p <= maxPages; p++) {
          const url = target.urlFn(p);
          console.log(`\n📄 [${target.label}] Página ${p}/${maxPages}`);

          const html = await fetchWithScraperAPI(url);
          creditsUsed += 10;
          console.log(`  🐝 ScraperAPI fetch OK (${creditsUsed} créditos usados)`);

          const cards = parsePlayerListHtml(html, url);
          console.log(`  ✓ ${cards.length} cartas extraídas`);

          if (target.forcePromo) {
            for (const card of cards) {
              card.cardType = target.forcePromo.cardType;
              card.promo = target.forcePromo.promo;
              card.promoOrder = target.forcePromo.order;
            }
          }

          let added = 0;
          for (const card of cards) {
            const key = `${card.eaId}:${card.cardType}`;
            if (!seen.has(key)) {
              seen.add(key);
              allCards.push(card);
              added++;
            }
          }
          console.log(`  ✓ ${added} nuevas (${cards.length - added} duplicadas)`);

          if (cards.length === 0 || (added === 0 && cards.length > 0)) {
            console.log(`  ⏭️  ${cards.length === 0 ? "Página vacía" : "Sin cartas nuevas"}, saltando resto de ${target.label}`);
            break;
          }
        }
      }

      console.log(`\n📊 Total: ${allCards.length} cartas únicas — ${creditsUsed} créditos ScraperAPI`);

      await saveCards(allCards);
    } catch (error) {
      console.error("❌ Error en scraper:", error);
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
    return;
  }

  // ─── PLAYWRIGHT MODE (local / fallback) ──────────────────────

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
    extraHTTPHeaders: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "DNT": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
  });

  const page = await context.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  console.log("🌐 Pre-visit FUTBIN homepage (establish session)...");
  await page.goto("https://www.futbin.com", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000 + Math.random() * 2000);
  try {
    const consent = page.locator("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll");
    if (await consent.count() > 0) await consent.first().click();
  } catch {}
  await page.waitForTimeout(2000 + Math.random() * 1000);

  await page.route("**/googlesyndication**", (route) => route.abort());
  await page.route("**/doubleclick**", (route) => route.abort());
  await page.route("**/google-analytics**", (route) => route.abort());
  await page.route("**/adsrvr.org**", (route) => route.abort());

  const seen = new Set<string>();
  let allCards: ScrapedCard[] = [];
  let dailyDiscovery: ScrapedCard[] = [];

  try {
    if (SCRAPE_DAILY) {
      console.log(`\n📅 Scraping cartas nuevas del día (discovery)...`);
      const dailyCards = await scrapeFutbinNewPlayers(page);
      let dailyAdded = 0;
      for (const card of dailyCards) {
        if (card.eaId > 0) {
          dailyDiscovery.push(card);
          dailyAdded++;
        }
      }
      console.log(`  ✅ ${dailyAdded} cartas descubiertas (${dailyCards.length - dailyAdded} sin EA ID)`);

      if (dailyCards.length > 0) {
        const delay = 3000 + Math.random() * 2000;
        await page.waitForTimeout(delay);
      }
    }

    const targets: Array<{ label: string; urlFn: (p: number) => string; forcePromo?: { cardType: string; promo: string; order: number } }> = [];

    if (USE_ROTATION) {
      const rotSquads = getRotationSquads();
      for (const squad of rotSquads) {
        targets.push({
          label: `Squad: ${squad}`,
          urlFn: (p) => futbinSquadUrl(squad, p),
          forcePromo: SQUAD_MAP[squad],
        });
      }
    } else if (AUTO_VERSIONS) {
      const discoveredSquads = await discoverFutbinSquads(page);
      for (const squad of discoveredSquads) {
        const squadInfo = SQUAD_MAP[squad];
        targets.push({
          label: `Squad: ${squad}`,
          urlFn: (p) => futbinSquadUrl(squad, p),
          forcePromo: squadInfo,
        });
      }
    } else if (hasSquads) {
      for (const squad of FUTBIN_SQUADS) {
        const squadInfo = SQUAD_MAP[squad];
        if (!squadInfo) {
          console.log(`⚠ Squad "${squad}" no encontrado en SQUAD_MAP`);
        }
        targets.push({
          label: `Squad: ${squad}`,
          urlFn: (p) => futbinSquadUrl(squad, p),
          forcePromo: squadInfo,
        });
      }
    } else {
      for (const version of FUTBIN_VERSIONS) {
        targets.push({
          label: `Version: ${version}`,
          urlFn: (p) => futbinPlayersUrl(version, p),
        });
      }
    }

    for (const target of targets) {
      console.log(`\n🏷️  ${target.label}`);

      for (let p = 1; p <= maxPages; p++) {
        const url = target.urlFn(p);
        console.log(`\n📄 [${target.label}] Página ${p}/${maxPages}`);

        const cards = await scrapeFutbinPlayerList(page, url);

        if (target.forcePromo) {
          for (const card of cards) {
            card.cardType = target.forcePromo.cardType;
            card.promo = target.forcePromo.promo;
            card.promoOrder = target.forcePromo.order;
          }
        }

        let added = 0;
        for (const card of cards) {
          const key = `${card.eaId}:${card.cardType}`;
          if (!seen.has(key)) {
            seen.add(key);
            allCards.push(card);
            added++;
          }
        }
        console.log(`  ✓ ${added} nuevas (${cards.length - added} duplicadas)`);

        if (cards.length === 0 || (added === 0 && cards.length > 0)) {
          console.log(`  ⏭️  ${cards.length === 0 ? "Página vacía" : "Sin cartas nuevas"}, saltando resto de ${target.label}`);
          break;
        }

        const isLast = p === maxPages && target === targets[targets.length - 1];
        if (!isLast) {
          const delay = 5000 + Math.random() * 5000;
          console.log(`  ⏱ Esperando ${(delay / 1000).toFixed(1)}s...`);
          await page.waitForTimeout(delay);
        }
      }
    }

    if (dailyDiscovery.length > 0) {
      allCards.push(...dailyDiscovery);
      console.log(`  📅 +${dailyDiscovery.length} cartas de discovery daily agregadas al final`);
    }

    await saveCards(allCards);
  } catch (error) {
    console.error("❌ Error en scraper:", error);
    process.exitCode = 1;
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

async function saveCards(allCards: ScrapedCard[]) {
  console.log(`\n📊 Total cartas (con duplicados): ${allCards.length}`);

  const dedupMap = new Map<string, { card: ScrapedCard; firstIndex: number }>();
  allCards.forEach((card, i) => {
    const key = `${card.eaId}:${card.cardType}`;
    const existing = dedupMap.get(key);
    if (!existing) {
      dedupMap.set(key, { card, firstIndex: i });
    } else {
      const hasStats = card.pace > 0 || card.shooting > 0;
      const existingHasStats = existing.card.pace > 0 || existing.card.shooting > 0;
      if (hasStats && !existingHasStats) {
        dedupMap.set(key, { card, firstIndex: existing.firstIndex });
      }
    }
  });

  const sorted = [...dedupMap.values()].sort((a, b) => a.firstIndex - b.firstIndex);
  allCards = sorted.map((s) => s.card);
  console.log(`  🔄 Deduplicado: ${allCards.length} cartas únicas`);

  const existingRows = await prisma.futCard.findMany({
    select: { eaId: true, cardType: true, promoOrder: true },
  });
  const existingOrder = new Map<string, number>(
    existingRows.map((c) => [`${c.eaId}:${c.cardType}`, c.promoOrder]),
  );
  const globalMax = existingRows.reduce((m, c) => Math.max(m, c.promoOrder), 0);

  const freshCards = allCards.filter(
    (c) => !existingOrder.has(`${c.eaId}:${c.cardType}`),
  );
  freshCards.forEach((card, i) => {
    card.promoOrder = globalMax + freshCards.length - i;
  });
  allCards.forEach((card) => {
    const key = `${card.eaId}:${card.cardType}`;
    const stored = existingOrder.get(key);
    if (stored !== undefined) card.promoOrder = stored;
  });
  console.log(
    `  📅 ${freshCards.length} cartas NUEVAS → order ${globalMax + 1}..${globalMax + freshCards.length} (sobre max ${globalMax}); ${allCards.length - freshCards.length} existentes congeladas`,
  );

  console.log(`\n💾 Guardando en Supabase...`);
  const saved = await upsertCards(allCards);
  console.log(`✅ ${saved} cartas guardadas/actualizadas\n`);

  if (allCards.length > 0 && saved === 0) {
    throw new Error(`Se extrajeron ${allCards.length} cartas pero se guardaron 0 — pipeline roto`);
  }
  if (allCards.length === 0) {
    throw new Error("0 cartas extraídas — DOM de FUTBIN cambió o bloqueo de bot");
  }
}

main();
