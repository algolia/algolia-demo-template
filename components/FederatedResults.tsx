"use client";

import { useEffect, useState } from "react";
import { algoliasearch } from "algoliasearch";
import Link from "next/link";
import { Clock, Users, BookOpen, Leaf } from "lucide-react";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import { proxyImageUrl } from "@/lib/utils/proxy-image";
import type { Recipe } from "@/lib/types/recipe";
import type { Guide } from "@/lib/types/guide";

let searchClient: ReturnType<typeof algoliasearch> | null = null;
function getSearchClient() {
  if (!searchClient && ALGOLIA_CONFIG.APP_ID && ALGOLIA_CONFIG.SEARCH_API_KEY) {
    searchClient = algoliasearch(ALGOLIA_CONFIG.APP_ID, ALGOLIA_CONFIG.SEARCH_API_KEY);
  }
  return searchClient;
}

export function useFederatedSearch(query: string) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.trim().length === 0) {
        setRecipes([]);
        setGuides([]);
        return;
      }

      try {
        const client = getSearchClient();
        if (!client) {
          setRecipes([]);
          setGuides([]);
          return;
        }

        const results = await client.search({
          requests: [
            {
              indexName: ALGOLIA_CONFIG.RECIPES_INDEX,
              query,
              hitsPerPage: 4,
            },
            {
              indexName: ALGOLIA_CONFIG.GUIDES_INDEX,
              query,
              hitsPerPage: 4,
            },
          ],
        });

        const recipesResult = results.results[0];
        if ("hits" in recipesResult) {
          setRecipes(recipesResult.hits as Recipe[]);
        }

        const guidesResult = results.results[1];
        if ("hits" in guidesResult) {
          setGuides(guidesResult.hits as Guide[]);
        }
      } catch (error) {
        console.error("Federated search error:", error);
        setRecipes([]);
        setGuides([]);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 150);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return { recipes, guides };
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const imgSrc = proxyImageUrl(recipe.imageUrl);
  return (
    <Link
      href={`/recipes/${recipe.objectID}`}
      className="flex rounded-lg border border-border bg-background hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden group"
    >
      <div className="relative w-20 shrink-0 bg-muted">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={recipe.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen size={20} className="text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="py-2.5 px-3 min-w-0">
        <h4 className="font-medium text-sm text-foreground leading-tight line-clamp-1 mb-1">
          {recipe.title}
        </h4>
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground mb-1">
          {recipe.totalTimeMinutes && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {recipe.totalTimeMinutes} min
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <Users size={11} />
              {recipe.servings}
            </span>
          )}
        </div>
        {recipe.categories && recipe.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function FederatedRecipes({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={16} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Recetas</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.objectID} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const imgSrc = proxyImageUrl(guide.imageUrl);
  return (
    <a
      href={guide.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex rounded-lg border border-border bg-background hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden group"
    >
      <div className="relative w-20 shrink-0 bg-muted">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={guide.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Leaf size={20} className="text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="py-2.5 px-3 min-w-0">
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
          {guide.category}
        </span>
        <h4 className="font-medium text-sm text-foreground leading-tight line-clamp-1 mt-1">
          {guide.title}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {guide.description}
        </p>
      </div>
    </a>
  );
}

export function GuidesSection({ guides }: { guides: Guide[] }) {
  if (guides.length === 0) return null;

  return (
    <div className="col-span-full py-2">
      <div className="flex items-center gap-2 mb-3">
        <Leaf size={16} className="text-emerald-600" />
        <h2 className="text-sm font-semibold text-foreground">
          Gu\u00edas alimentarias
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {guides.map((guide) => (
          <GuideCard key={guide.objectID} guide={guide} />
        ))}
      </div>
    </div>
  );
}
