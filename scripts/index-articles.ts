/**
 * Template: Secondary Content (Articles) Indexing Script
 *
 * This script indexes article/blog content into a separate Algolia index,
 * enabling the AI agent to search articles alongside products.
 *
 * Key patterns:
 * - `attributeForDistinct: "url"` + `distinct: true` ensures one result per URL
 *   (deduplicates content that may appear at multiple paths)
 * - Batch indexing with configurable batch size
 * - Separate index from products for clean content separation
 *
 * Usage:
 *   1. Place your articles in `data/articles.json` (see RawArticle interface)
 *   2. Set ALGOLIA_ADMIN_API_KEY in .env
 *   3. Run: pnpm tsx scripts/index-articles.ts
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";

const client = algoliasearch(
  ALGOLIA_CONFIG.APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY!
);
const INDEX_NAME = ALGOLIA_CONFIG.ARTICLES_INDEX;

interface RawArticle {
  url: string;
  title: string;
  description: string;
  date_published: string;
  date_modified: string;
  word_count: number;
  author: string;
  categories: string[];
  tags: string[];
  image_url: string;
  body_text: string;
}

function cleanText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function transformArticles(raw: Record<string, unknown>[]) {
  return raw
    .filter((a) => a.title)
    .map((a, i) => ({
      objectID: (a.objectID as string) || `article_${i}`,
      title: cleanText(String(a.title || "")),
      body_text: cleanText(String(a.body_text || a.summary || a.description || "")).slice(0, 5000),
      summary: cleanText(String(a.summary || a.description || a.body_text || "")).slice(0, 300),
      url: a.url as string,
      date_published: (a.date_published as string) || "",
      date_modified: (a.date_modified as string) || "",
      author: (a.author as string) || "",
      categories: (a.categories as string[]) || [(a.category as string) || ""].filter(Boolean),
      tags: (a.tags as string[]) || [],
      image_url: (a.image_url as string) || "",
      word_count: (a.word_count as number) || 0,
      type: "article",
    }));
}

async function main() {
  console.log("Reading articles from data/articles.json...");
  const raw: Record<string, unknown>[] = JSON.parse(
    readFileSync("data/articles.json", "utf-8")
  );
  console.log(`Found ${raw.length} articles`);

  const records = transformArticles(raw);
  console.log(`Transformed ${records.length} articles`);

  const BATCH_SIZE = 500;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await client.saveObjects({ indexName: INDEX_NAME, objects: batch });
    console.log(
      `Indexed ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}`
    );
  }

  console.log("Configuring index settings...");
  await client.setSettings({
    indexName: INDEX_NAME,
    indexSettings: {
      searchableAttributes: [
        "unordered(title)",
        "unordered(categories)",
        "unordered(tags)",
        "unordered(summary)",
        "unordered(body_text)",
      ],
      attributesForFaceting: [
        "searchable(categories)",
        "searchable(tags)",
        "type",
      ],
      attributesToSnippet: ["body_text:60"],
      // TODO: Update language settings for your demo
      indexLanguages: ["en"],
      queryLanguages: ["en"],
      removeStopWords: true,
      ignorePlurals: true,
      customRanking: ["desc(date_modified)"],
      // Deduplication: one result per URL — prevents duplicate content
      attributeForDistinct: "url",
      distinct: true,
    },
  });

  console.log(`Done! ${records.length} articles indexed to "${INDEX_NAME}"`);
}

main().catch(console.error);
