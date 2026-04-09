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
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&egrave;/g, "è")
    .replace(/&agrave;/g, "à")
    .replace(/&eacute;/g, "é")
    .replace(/&ograve;/g, "ò")
    .replace(/&ugrave;/g, "ù")
    .replace(/&igrave;/g, "ì")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function transformArticles(raw: RawArticle[]) {
  return raw
    .filter((a) => a.body_text?.trim())
    .map((a, i) => ({
      objectID: `article_${i}`,
      title: cleanText(a.title),
      body_text: cleanText(a.body_text).slice(0, 5000),
      summary: cleanText(a.body_text).slice(0, 300),
      url: a.url,
      date_published: a.date_published,
      date_modified: a.date_modified,
      author: a.author,
      categories: a.categories,
      tags: a.tags,
      image_url: a.image_url,
      word_count: a.word_count,
      type: "article",
    }));
}

async function main() {
  console.log("Reading articles from data/articles.json...");
  const raw: RawArticle[] = JSON.parse(
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
      indexLanguages: ["it"],
      queryLanguages: ["it"],
      removeStopWords: true,
      ignorePlurals: true,
      customRanking: ["desc(date_modified)"],
    },
  });

  console.log(`Done! ${records.length} articles indexed to "${INDEX_NAME}"`);
}

main().catch(console.error);
