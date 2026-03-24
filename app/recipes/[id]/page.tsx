import { algoliasearch } from "algoliasearch";
import RecipePage from "@/components/RecipePage";
import { Recipe } from "@/lib/types/recipe";
import { notFound } from "next/navigation";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";

interface RecipePageParams {
  params: Promise<{
    id: string;
  }>;
}

async function getRecipe(objectID: string): Promise<Recipe | null> {
  if (!ALGOLIA_CONFIG.APP_ID || !ALGOLIA_CONFIG.SEARCH_API_KEY) {
    console.error("Algolia credentials are missing");
    return null;
  }

  if (!objectID) {
    console.error("objectID is required");
    return null;
  }

  try {
    const searchClient = algoliasearch(ALGOLIA_CONFIG.APP_ID, ALGOLIA_CONFIG.SEARCH_API_KEY);

    const result = await searchClient.getObject({
      indexName: ALGOLIA_CONFIG.RECIPES_INDEX,
      objectID: objectID,
    });
    return result as unknown as Recipe;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return null;
  }
}

export default async function RecipeDetailPage({ params }: RecipePageParams) {
  const { id } = await params;
  const recipe = await getRecipe(id);

  if (!recipe) {
    notFound();
  }

  return <RecipePage recipe={recipe} />;
}
