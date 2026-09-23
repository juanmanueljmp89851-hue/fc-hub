/**
 * Import SBCs from data/sbcs-latest.json into DB (SystemConfig).
 * Runs in GitHub Actions after Claude Routine pushes fresh JSON.
 *
 * Usage: npx tsx scripts/import-sbcs.ts
 */

import { readFileSync, existsSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SBC_KEY = "active_sbcs";
const SOLUTIONS_KEY = "sbc_solutions";

async function main() {
  const sbcPath = "data/sbcs-latest.json";
  const solPath = "data/sbc-solutions-latest.json";

  if (!existsSync(sbcPath)) {
    console.error(`[import-sbcs] ${sbcPath} not found — nothing to import.`);
    process.exit(1);
  }

  const sbcs = JSON.parse(readFileSync(sbcPath, "utf-8"));
  if (!Array.isArray(sbcs) || sbcs.length === 0) {
    console.warn("[import-sbcs] ⚠️ JSON has 0 SBCs — skipping to preserve existing data.");
    await prisma.$disconnect();
    return;
  }

  console.log(`[import-sbcs] Importing ${sbcs.length} SBCs to DB...`);
  await prisma.systemConfig.upsert({
    where: { key: SBC_KEY },
    update: { value: sbcs as any },
    create: { key: SBC_KEY, value: sbcs as any },
  });
  console.log(`[import-sbcs] ✅ ${sbcs.length} SBCs saved.`);

  if (existsSync(solPath)) {
    const solutions = JSON.parse(readFileSync(solPath, "utf-8"));
    const count = Object.keys(solutions).length;
    if (count > 0) {
      await prisma.systemConfig.upsert({
        where: { key: SOLUTIONS_KEY },
        update: { value: solutions as any },
        create: { key: SOLUTIONS_KEY, value: solutions as any },
      });
      console.log(`[import-sbcs] ✅ ${count} solutions saved.`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[import-sbcs] Fatal:", e);
  process.exit(1);
});
