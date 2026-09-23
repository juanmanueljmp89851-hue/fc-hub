/**
 * Import articles from data/articles-latest.json into DB.
 * Runs in GitHub Actions after Claude Routine pushes fresh JSON.
 *
 * Usage: npx tsx scripts/import-articles.ts
 */

import { readFileSync, existsSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ArticleData {
  slug: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  sourceUrl?: string;
  sourceName?: string;
}

async function main() {
  const path = "data/articles-latest.json";

  if (!existsSync(path)) {
    console.error(`[import-articles] ${path} not found.`);
    process.exit(1);
  }

  const articles: ArticleData[] = JSON.parse(readFileSync(path, "utf-8"));
  if (!Array.isArray(articles) || articles.length === 0) {
    console.warn("[import-articles] JSON has 0 articles — skipping.");
    await prisma.$disconnect();
    return;
  }

  let created = 0;
  let updated = 0;

  for (const a of articles) {
    const existing = await prisma.article.findUnique({ where: { slug: a.slug } });
    if (existing) {
      await prisma.article.update({
        where: { slug: a.slug },
        data: {
          title: a.title,
          summary: a.summary,
          content: a.content,
          imageUrl: a.imageUrl,
          category: a.category,
          tags: a.tags,
          sourceUrl: a.sourceUrl,
          sourceName: a.sourceName,
        },
      });
      updated++;
    } else {
      await prisma.article.create({ data: a });
      created++;
    }
  }

  console.log(`[import-articles] ✅ ${created} created, ${updated} updated.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[import-articles] Fatal:", e);
  process.exit(1);
});
