"use client";

import { useEffect, useState } from "react";
import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types/product";
import type { Recipe } from "@/lib/types/recipe";
import { ShoppingCart } from "lucide-react";

let searchClient: ReturnType<typeof algoliasearch> | null = null;
function getSearchClient() {
  if (!searchClient && ALGOLIA_CONFIG.APP_ID && ALGOLIA_CONFIG.SEARCH_API_KEY) {
    searchClient = algoliasearch(ALGOLIA_CONFIG.APP_ID, ALGOLIA_CONFIG.SEARCH_API_KEY);
  }
  return searchClient;
}

type IngredientResults = Record<string, Product[]>;

export default function IngredientProductCarousel({
  ingredientProducts,
}: {
  ingredientProducts: Recipe["ingredientProducts"];
}) {
  const [results, setResults] = useState<IngredientResults>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ingredientProducts) {
      setLoading(false);
      return;
    }

    const entries = Object.entries(ingredientProducts).filter(
      ([, products]) => products && products.length > 0
    );

    if (entries.length === 0) {
      setLoading(false);
      return;
    }

    const client = getSearchClient();
    if (!client) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      const fetched: IngredientResults = {};

      await Promise.all(
        entries.map(async ([ingredient, products]) => {
          const optionalFilters = products.map(
            (p) => `objectID:${p.objectID}<score=10>`
          );

          try {
            const { hits } = await client.searchSingleIndex<Product>({
              indexName: ALGOLIA_CONFIG.INDEX_NAME,
              searchParams: {
                query: ingredient,
                optionalFilters,
                hitsPerPage: 6,
              },
            });
            fetched[ingredient] = hits;
          } catch {
            fetched[ingredient] = [];
          }
        })
      );

      setResults(fetched);
      setLoading(false);
    };

    fetchAll();
  }, [ingredientProducts]);

  const entries = Object.entries(ingredientProducts || {}).filter(
    ([, products]) => products && products.length > 0
  );

  if (entries.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart size={20} className="text-primary" />
        <h2 className="text-xl font-bold text-foreground">
          Productos relacionados
        </h2>
      </div>
      <div className="space-y-8">
        {entries.map(([ingredient]) => (
          <div key={ingredient}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 capitalize">
              {ingredient}
            </h3>
            <div className="flex overflow-x-auto gap-4 pb-2">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-48 shrink-0 h-72 rounded-lg bg-muted animate-pulse"
                    />
                  ))
                : (results[ingredient] || []).map((product) => (
                    <div key={product.objectID} className="w-48 shrink-0">
                      <ProductCard product={product} />
                    </div>
                  ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
