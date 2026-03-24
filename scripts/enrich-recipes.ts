import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "../lib/algolia-config";
import type { Recipe } from "../lib/types/recipe";

const client = algoliasearch(
  ALGOLIA_CONFIG.APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY!
);

type IngredientProduct = { objectID: string; title: string; brand: string };

/** Strip leading quantities/units from raw to get a clean ingredient name */
function cleanName(raw: string): string {
  // Remove leading numbers, fractions, units like "g", "ml", "L.", "cucharada(s)"
  return raw
    .replace(
      /^[\d.,/½¼¾⅓⅔]+\s*/,
      ""
    )
    .replace(
      /^(cucharadas?|cucharaditas?|tazas?|vasos?|pizcas?|ramas?|dientes?|hojas?|lonchas?|rebanadas?|rodajas?|láminas?|unidades?|paquetes?|botes?|latas?|sobres?|trozo|trozos|puñado|puñados|un|una|unas?|unos?)\s+(de\s+)?/i,
      ""
    )
    .replace(/^(soperas?|pequeñas?|grandes?)\s+(de\s+)?/i, "")
    .replace(/^de\s+/i, "")
    .replace(/\s*\.$/, "")
    .trim();
}

/** Check if a name field looks like bad parser output */
function isBadName(name: string): boolean {
  if (name.length <= 3) return true;
  if (/^\d/.test(name)) return true;
  if (/^de\s/i.test(name)) return true;
  if (/^(L|ml|g|kg|cl)\.$/.test(name)) return true;
  return false;
}

function cleanIngredientsFull(
  ingredientsFull: Recipe["ingredientsFull"]
): Recipe["ingredientsFull"] {
  // Remove "The 5 of" placeholder entries
  let cleaned = ingredientsFull.filter(
    (i) => i.name !== "The 5 of" && i.raw !== "The 5 of"
  );
  // Remove instruction-like entries (long sentences)
  cleaned = cleaned.filter((i) => i.raw.length <= 80);
  // Fix bad name fields using the raw field
  cleaned = cleaned.map((i) => ({
    name: isBadName(i.name) ? cleanName(i.raw) : i.name,
    raw: i.raw,
  }));
  // Deduplicate by raw field
  const seen = new Set<string>();
  cleaned = cleaned.filter((i) => {
    if (seen.has(i.raw)) return false;
    seen.add(i.raw);
    return true;
  });
  return cleaned;
}

async function searchProducts(
  query: string
): Promise<IngredientProduct[]> {
  const res = await client.searchSingleIndex({
    indexName: ALGOLIA_CONFIG.INDEX_NAME,
    searchParams: {
      query,
      hitsPerPage: 3,
      attributesToRetrieve: ["objectID", "title", "brand"],
    },
  });
  return res.hits.map((hit) => {
    const h = hit as Record<string, unknown>;
    return {
      objectID: String(h.objectID),
      title: String(h.title || ""),
      brand: String(h.brand || ""),
    };
  });
}

async function enrichRecipe(
  recipe: Recipe & Record<string, unknown>
): Promise<Recipe & Record<string, unknown>> {
  // Clean ingredientsFull
  const cleanedFull = cleanIngredientsFull(recipe.ingredientsFull || []);
  recipe.ingredientsFull = cleanedFull;
  recipe.ingredients = cleanedFull.map((i) => i.name);

  // Rebuild ingredientProducts from scratch
  const ingredientProducts: Record<string, IngredientProduct[]> = {};

  for (const ingredient of cleanedFull) {
    const products = await searchProducts(ingredient.raw);
    ingredientProducts[ingredient.name] = products;
  }

  // Fallback: if no ingredients at all, search by recipe title
  if (cleanedFull.length === 0) {
    const products = await searchProducts(recipe.title);
    if (products.length > 0) {
      ingredientProducts[recipe.title] = products;
    }
  }

  recipe.ingredientProducts = ingredientProducts;
  return recipe;
}

async function main() {
  console.log("Loading recipes from data/new_consum_recipes.json...");
  const recipes: (Recipe & Record<string, unknown>)[] = JSON.parse(
    readFileSync("data/new_consum_recipes.json", "utf-8")
  );
  console.log(`Loaded ${recipes.length} recipes\n`);

  let the5ofCount = 0;
  let missingProducts = 0;

  for (const r of recipes) {
    if (r.ingredientsFull?.some((i) => i.name === "The 5 of")) the5ofCount++;
    if (
      !r.ingredientProducts ||
      Object.keys(r.ingredientProducts).length === 0
    )
      missingProducts++;
  }
  console.log(
    `Before: ${the5ofCount} recipes with "The 5 of", ${missingProducts} missing ingredientProducts\n`
  );

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    console.log(
      `[${i + 1}/${recipes.length}] ${recipe.title} — ${recipe.ingredientsFull?.length || 0} ingredients`
    );
    await enrichRecipe(recipe);
    const matchCount = Object.keys(recipe.ingredientProducts).length;
    const fallback = recipe.ingredientsFull.length === 0 ? " (title fallback)" : "";
    console.log(
      `  → ${recipe.ingredientsFull.length} cleaned, ${matchCount} matched${fallback}`
    );
  }

  // Verify
  const postThe5of = recipes.filter((r) =>
    r.ingredientsFull?.some((i) => i.name === "The 5 of")
  ).length;
  const postMissing = recipes.filter(
    (r) =>
      !r.ingredientProducts ||
      Object.keys(r.ingredientProducts).length === 0
  ).length;
  console.log(
    `\nAfter: ${postThe5of} recipes with "The 5 of", ${postMissing} missing ingredientProducts`
  );

  // Write to file
  writeFileSync(
    "data/new_consum_recipes.json",
    JSON.stringify(recipes, null, 2) + "\n"
  );
  console.log("Written to data/new_consum_recipes.json");

  // Push to Algolia
  console.log(
    `\nIndexing ${recipes.length} recipes to ${ALGOLIA_CONFIG.RECIPES_INDEX}...`
  );
  await client.saveObjects({
    indexName: ALGOLIA_CONFIG.RECIPES_INDEX,
    objects: recipes,
  });
  console.log("Done! All recipes indexed.");
}

main().catch(console.error);
