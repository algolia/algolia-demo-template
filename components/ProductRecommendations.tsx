"use client";

import { useEffect, useState } from "react";
import { recommendClient } from "@algolia/recommend";
import { Product } from "@/lib/types/product";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import { ProductCard } from "@/components/ProductCard";

const client = recommendClient(
  ALGOLIA_CONFIG.APP_ID,
  ALGOLIA_CONFIG.SEARCH_API_KEY
);

interface ProductRecommendationsProps {
  objectID: string;
}

function RecommendationCarousel({
  title,
  recommendations,
  loading,
}: {
  title: string;
  recommendations: Product[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <ProductCard
            key={product.objectID}
            product={product}
            showBadges={false}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProductRecommendations({
  objectID,
}: ProductRecommendationsProps) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    client
      .getRecommendations({
        requests: [
          {
            indexName: ALGOLIA_CONFIG.INDEX_NAME,
            objectID,
            model: "related-products",
            maxRecommendations: 4,
            threshold: 0,
          },
        ],
      })
      .then((response) => {
        if (cancelled) return;
        const results = response.results;
        setRelatedProducts((results[0]?.hits as Product[]) || []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [objectID]);

  const hasAny = loading || relatedProducts.length > 0;

  if (!hasAny) return null;

  return (
    <section className="mt-12 pt-8 border-t border-border space-y-10">
      <RecommendationCarousel
        title="Related Products"
        recommendations={relatedProducts}
        loading={loading}
      />
    </section>
  );
}
